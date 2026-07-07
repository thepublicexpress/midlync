const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sb-grsapzroyfcueysrmedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiLWdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTAyODM5MCwiZXhwIjoxODY4Nzk0MzkwfQ.sLYL3OZEfEfH1s2XqPrL9SHaLJ1VRBPQaLb_FdAKPLI'
);

async function clearOrders() {
  try {
    console.log('🗑️ Clearing all orders...');
    const { data, error } = await supabase.from('orders').select('id').limit(1000);
    
    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No orders to delete');
      process.exit(0);
    }

    console.log(`Found ${data.length} orders. Deleting...`);
    const { error: deleteError } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ Error deleting orders:', deleteError);
      return;
    }
    
    console.log('✅ All orders cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

clearOrders();
