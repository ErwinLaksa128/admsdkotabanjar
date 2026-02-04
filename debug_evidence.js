
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpfeecsmfisflnupxsnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmVlY3NtZmlzZmxudXB4c25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI2OTgsImV4cCI6MjA4NTUyODY5OH0.fH0fAYA7lnPq5_l47o47Y6EsuUoflosTMXpkcnxvFDQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Fetching Kepala Sekolah users...');
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'kepala-sekolah');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} Kepala Sekolah users.`);
  
  users.forEach(u => {
    console.log(`\nUser: ${u.name} (${u.nip})`);
    console.log('workloadEvidence_v2 (raw):', u.workloadEvidence_v2);
    console.log('workloadevidence_v2 (lowercase):', u.workloadevidence_v2);
    
    // Check if it's a string that needs parsing
    if (typeof u.workloadEvidence_v2 === 'string') {
        console.log('workloadEvidence_v2 is a string, trying to parse...');
        try {
            console.log('Parsed:', JSON.parse(u.workloadEvidence_v2));
        } catch (e) {
            console.log('Failed to parse JSON');
        }
    }
  });
}

checkData();
