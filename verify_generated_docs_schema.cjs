
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for verification convenience
const supabaseUrl = 'https://lpfeecsmfisflnupxsnq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwZmVlY3NtZmlzZmxudXB4c25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI2OTgsImV4cCI6MjA4NTUyODY5OH0.fH0fAYA7lnPq5_l47o47Y6EsuUoflosTMXpkcnxvFDQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('Verifying generated_docs schema columns...');

  // Try to insert a record with ALL required columns
  const dummyLog = {
    teacherNip: 'TEST_VERIFY_SCHEMA',
    teacherName: 'Schema Verifier',
    school: 'Test School',
    docType: 'Test Doc',
    fileName: 'test.pdf',
    fileUrl: 'http://test.com'
  };

  console.log('Attempting to insert record with new columns:', Object.keys(dummyLog).join(', '));

  const { data, error } = await supabase
    .from('generated_docs')
    .insert(dummyLog)
    .select();

  if (error) {
    console.error('\n❌ SCHEMA VERIFICATION FAILED');
    console.error('Error details:', error.message);
    
    if (error.message.includes('Could not find the') && error.message.includes('column')) {
        console.log('\nDIAGNOSIS: The database table is missing required columns.');
        console.log('ACTION REQUIRED: Please run the SQL in "FIX_ALL_ISSUES.sql" in your Supabase SQL Editor.');
    }
  } else {
    console.log('\n✅ SCHEMA VERIFICATION PASSED');
    console.log('Successfully inserted record with all new columns.');
    console.log('The database is ready for the Progress Bar feature.');

    // Cleanup
    const { error: deleteError } = await supabase
        .from('generated_docs')
        .delete()
        .eq('teacherNip', 'TEST_VERIFY_SCHEMA');
        
    if (deleteError) console.error('Warning: Could not clean up test record');
    else console.log('Cleaned up test record.');
  }
}

verifySchema();
