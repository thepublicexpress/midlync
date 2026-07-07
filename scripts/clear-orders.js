#!/usr/bin/env node

// Clear all orders from Supabase
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

const SUPABASE_URL = 'https://sb-grsapzroyfcueysrmedk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiLWdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTAyODM5MCwiZXhwIjoxODY4Nzk0MzkwfQ.sLYL3OZEfEfH1s2XqPrL9SHaLJ1VRBPQaLb_FdAKPLI';

async function clearOrders() {
  try {
    console.log('🗑️ Clearing all orders from database...\n');

    // Delete all orders
    const response = await axios.delete(
      `${SUPABASE_URL}/rest/v1/orders?id=neq.00000000-0000-0000-0000-000000000000`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      }
    );

    console.log('✅ All orders cleared successfully!');
    console.log(`\n📊 Status: ${response.status}`);
    process.exit(0);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ No orders found (table may be empty)');
      process.exit(0);
    }
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  }
}

clearOrders();
