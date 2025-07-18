// supabaseClient.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ogasbpuqwipydcawiuhw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Try to verify the connection with a basic test
(async () => {
  const { error } = await supabase.from('tblAdmins').select().limit(1);
  if (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
  } else {
    console.log('✅ Successfully connected to Supabase');
  }
})();

module.exports = { supabase };
