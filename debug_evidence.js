
const { createClient } = require('@supabase/supabase-js');

// Mock environment variables if not present (since we are running this script directly)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xyz.supabase.co'; 
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'ey...';

// We need to read the actual env file or just use the ones from the project if possible
// For this environment, I'll assume I can read the .env file or I need the user to provide them
// But I can't ask user for secrets. I'll try to read .env file.

const fs = require('fs');
const path = require('path');

let url = '';
let key = '';

try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        const lines = envConfig.split('\n');
        for (const line of lines) {
            if (line.startsWith('VITE_SUPABASE_URL=')) {
                url = line.split('=')[1].trim();
            }
            if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
                key = line.split('=')[1].trim();
            }
        }
    }
} catch (e) {
    console.log('Error reading .env', e);
}

if (!url || !key) {
    console.error('Could not find Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(url, key);

const parseJsonIfNeeded = (val) => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === 'string') {
          return parseJsonIfNeeded(parsed);
        }
        return parsed;
      } catch (e) {
        return {};
      }
    }
    return val || {};
  };
  
  const normalizeUser = (u) => {
    let scores = parseJsonIfNeeded(u.workloadScores_v2 || u.workloadscores_v2);
    
    // Log raw scores for debugging
    if (u.name.includes('Budi')) {
        console.log(`[Normalize] Raw scores for ${u.name}:`, typeof u.workloadScores_v2, u.workloadScores_v2);
        console.log(`[Normalize] Parsed scores:`, scores);
    }

    const feedback = u.workloadFeedback_v2 || u.workloadfeedback_v2 || scores?._feedback || '';
    const feedbackDate = u.workloadFeedbackDate_v2 || u.workloadfeedbackdate_v2 || scores?._feedbackDate || '';
  
    let evidence = parseJsonIfNeeded(u.workloadEvidence_v2 || u.workloadevidence_v2);
    if (scores?._evidence) {
        evidence = scores._evidence;
    } else if (Object.keys(evidence).length === 0 && scores?._evidence) {
        evidence = scores._evidence;
    }
  
    if (scores && (scores._feedback || scores._feedbackDate || scores._evidence)) {
        const cleanScores = { ...scores };
        delete cleanScores._feedback;
        delete cleanScores._feedbackDate;
        delete cleanScores._evidence;
        scores = cleanScores;
    }
    
    return {
      ...u,
      workloadEvidence_v2: evidence,
      workloadScores_v2: scores,
      workloadFeedback_v2: feedback,
      workloadFeedbackDate_v2: feedbackDate
    };
  };

async function checkEvidence() {
    console.log('Fetching users...');
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'kepala-sekolah');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} principals.`);

    const targetSchool = 'SDN Percontohan 1'; // Normalized check
    
    // Filter for SDN Percontohan 1
    const schoolUsers = users.filter(u => 
        (u.school || '').trim().toLowerCase().replace(/\s+/g, ' ') === targetSchool.trim().toLowerCase().replace(/\s+/g, ' ')
    );

    console.log(`Found ${schoolUsers.length} users for ${targetSchool}`);

    schoolUsers.forEach(u => {
        console.log(`\n--------------------------------------------------`);
        console.log(`User: ${u.name} (${u.nip})`);
        console.log(`School: '${u.school}'`);
        console.log(`Active: ${u.active}`);
        
        // Check raw columns
        console.log('Raw workloadEvidence_v2:', u.workloadEvidence_v2);
        console.log('Raw workloadScores_v2:', u.workloadScores_v2);

        const normalized = normalizeUser(u);
        
        console.log('Normalized workloadEvidence_v2:', normalized.workloadEvidence_v2);
        const evidenceKeys = Object.keys(normalized.workloadEvidence_v2 || {});
        console.log('Evidence Keys:', evidenceKeys);
        
        if (evidenceKeys.length > 0) {
            console.log('✅ Evidence FOUND for this user');
        } else {
            console.log('❌ Evidence MISSING for this user');
        }
    });
}

checkEvidence();
