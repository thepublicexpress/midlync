const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sb-grsapzroyfcueysrmedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiLWdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTAyODM5MCwiZXhwIjoxODY4Nzk0MzkwfQ.sLYL3OZEfEfH1s2XqPrL9SHaLJ1VRBPQaLb_FdAKPLI'
);

async function setupTestData() {
  try {
    // Create test manufacturer
    const { data: mfr, error: mfrError } = await supabase
      .from('profiles')
      .insert({
        role: 'manufacturer',
        company_name: 'TechCo Manufacturing',
        email: 'mfr@techco.com',
        is_approved: true,
        approval_status: 'approved',
        manufacturer_code: 'MFR-TECH001',
        subscription_plan: 'premium'
      })
      .select();

    if (mfrError) {
      console.log('❌ Mfr error:', mfrError.message);
      process.exit(1);
    }
    
    console.log('✅ Manufacturer created:', mfr?.[0]?.id);
    const manufacturerId = mfr?.[0]?.id;

    // Create test products
    if (manufacturerId) {
      const products = [
        {
          title: 'Industrial Motor 5HP',
          description: 'Heavy-duty industrial motor for manufacturing',
          manufacturer_id: manufacturerId,
          category: 'Motors',
          price_per_unit: 15000,
          currency: 'INR',
          moq: 1,
          unit: 'pcs',
          status: 'active'
        },
        {
          title: 'Steel Bearings Set',
          description: 'Premium quality steel bearings',
          manufacturer_id: manufacturerId,
          category: 'Components',
          price_per_unit: 2500,
          currency: 'INR',
          moq: 10,
          unit: 'pcs',
          status: 'active'
        },
        {
          title: 'Hydraulic Pump 50cc',
          description: 'Professional grade hydraulic pump',
          manufacturer_id: manufacturerId,
          category: 'Pumps',
          price_per_unit: 8500,
          currency: 'INR',
          moq: 2,
          unit: 'pcs',
          status: 'active'
        }
      ];

      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .insert(products)
        .select();

      if (prodError) {
        console.log('❌ Products error:', prodError.message);
        process.exit(1);
      }
      
      console.log(`✅ ${productsData?.length || 0} products created`);
    }

    console.log('\n✅ Test data setup complete!');
    process.exit(0);
  } catch (err) {
    console.log('❌ Error:', err.message);
    process.exit(1);
  }
}

setupTestData();
