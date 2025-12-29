/**
 * Google Apps Script
 * Generate Dokumen dari Template PJOK
 * MODE: Recursive + Replace Placeholder + Export PDF
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const {
      sekolah,
      nama,
      nip,
      kepsek,
      nipKepsek,
      pengawas,
      nipPengawas,
      folderId,
      type
    } = data;

    if (!folderId) throw new Error("folderId tidak dikirim");
    if (!type) throw new Error("type tidak dikirim");

    const OUTPUT_ROOT_ID = "1WhDYP9aTh8z4sp4uwssDu3DMlD-QhkLZ";

    const outputRoot = DriveApp.getFolderById(OUTPUT_ROOT_ID);
    const templateRoot = DriveApp.getFolderById(folderId);

    // Folder output user
    const userFolderName = `${nama.toUpperCase()} - ${sekolah.toUpperCase()}`;
    const userFolder = getOrCreateFolder(outputRoot, userFolderName);
    const outputFolder = getOrCreateFolder(userFolder, type);

    // 🧹 CLEANUP: Hapus file lama di folder output agar selalu fresh
    clearFolder(outputFolder);

    // 🔍 SMART SEARCH: Cari folder yang MENGANDUNG nama label (Case Insensitive)
    // Ini akan cocok: "Program Tahunan" -> "3. Program Tahunan"
    let sourceFolder = null;
    const subFolders = templateRoot.getFolders();
    while (subFolders.hasNext()) {
      const f = subFolders.next();
      // Logic: Jika nama folder mengandung Type (docName), ATAU Type mengandung nama folder
      if (f.getName().toLowerCase().includes(type.toLowerCase())) {
        sourceFolder = f;
        break; // Ambil yang pertama ketemu
      }
    }

    if (!sourceFolder) {
      return responseJSON({
        status: "error",
        message: `Folder template '${type}' tidak ditemukan`
      });
    }

    const pdfUrls = [];
    processFolderRecursive(sourceFolder, outputFolder, data, pdfUrls);

    if (pdfUrls.length === 0) {
      return responseJSON({
        status: "error",
        message: "Template ditemukan, tapi tidak ada file Google Docs/Sheets yang bisa diproses"
      });
    }

    return responseJSON({
      status: "success",
      message: "Dokumen berhasil digenerate",
      folderUrl: outputFolder.getUrl(),
      files: pdfUrls
    });

  } catch (err) {
    return responseJSON({
      status: "error",
      message: err.toString()
    });
  }
}

/* ===================================================== */
/* =================== RECURSIVE ======================= */
/* ===================================================== */

function processFolderRecursive(sourceFolder, targetFolder, params, pdfUrls) {
  const files = sourceFolder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (isValidFile(file)) {
      const pdfUrl = processFile(file, targetFolder, params);
      if (pdfUrl) pdfUrls.push(pdfUrl);
    }
  }

  const folders = sourceFolder.getFolders();
  while (folders.hasNext()) {
    const sub = folders.next();
    const nextTarget = getOrCreateFolder(targetFolder, sub.getName());
    processFolderRecursive(sub, nextTarget, params, pdfUrls);
  }
}

/* ===================================================== */
/* ================= FILE PROCESS ====================== */
/* ===================================================== */

function processFile(file, dest, params) {
  const mime = file.getMimeType();
  const {
    sekolah,
    nama,
    nip,
    kepsek,
    nipKepsek,
    pengawas,
    nipPengawas
  } = params;

  // ================= GOOGLE DOCS =================
  if (mime === MimeType.GOOGLE_DOCS) {
    const copy = file.makeCopy(file.getName(), dest);
    const doc = DocumentApp.openById(copy.getId());
    const body = doc.getBody();

    body.replaceText("{{Nama_Sekolah}}", sekolah || "");
    body.replaceText("{{Nama_Guru}}", nama || "");
    body.replaceText("{{NIP_Guru}}", nip || "");
    body.replaceText("{{Kepala_Sekolah}}", kepsek || "");
    body.replaceText("{{NIP_Kepala_Sekolah}}", nipKepsek || "");
    body.replaceText("{{Nama_Pengawas}}", pengawas || "");
    body.replaceText("{{NIP_Pengawas}}", nipPengawas || "");

    doc.saveAndClose();

    const pdfFile = dest.createFile(
      copy.getAs(MimeType.PDF)
    ).setName(copy.getName() + ".pdf");

    copy.setTrashed(true);
    return pdfFile.getUrl();
  }

  // ================= GOOGLE SHEETS =================
  if (mime === MimeType.GOOGLE_SHEETS) {
    const copy = file.makeCopy(file.getName(), dest);
    const ss = SpreadsheetApp.openById(copy.getId());

    ss.getSheets().forEach(sheet => {
      const range = sheet.getDataRange();
      const values = range.getValues().map(row =>
        row.map(cell =>
          typeof cell === "string"
            ? cell
                .replace(/{{Nama_Sekolah}}/g, sekolah || "")
                .replace(/{{Nama_Guru}}/g, nama || "")
                .replace(/{{NIP_Guru}}/g, nip || "")
                .replace(/{{Kepala_Sekolah}}/g, kepsek || "")
                .replace(/{{NIP_Kepala_Sekolah}}/g, nipKepsek || "")
                .replace(/{{Nama_Pengawas}}/g, pengawas || "")
                .replace(/{{NIP_Pengawas}}/g, nipPengawas || "")
            : cell
        )
      );
      range.setValues(values);
    });

    const pdfFile = dest.createFile(
      copy.getAs(MimeType.PDF)
    ).setName(copy.getName() + ".pdf");

    copy.setTrashed(true);
    return pdfFile.getUrl();
  }

  return null;
}

/* ===================================================== */
/* ==================== UTIL =========================== */
/* ===================================================== */

function clearFolder(folder) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
}

function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/^\d+\.\s*/g, "") // hapus "3. "
    .replace(/\s+/g, " ")
    .trim();
}

function getOrCreateFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function isValidFile(file) {
  const name = file.getName();
  if (name.startsWith("~$")) return false;

  const mime = file.getMimeType();
  return (
    mime === MimeType.GOOGLE_DOCS ||
    mime === MimeType.GOOGLE_SHEETS
  );
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
