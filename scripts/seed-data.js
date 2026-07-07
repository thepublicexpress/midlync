const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiLWdyc2FwenJveWZjdWV5c3JtZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTAyODM5MCwiZXhwIjoxODY4Nzk0MzkwfQ.sLYL3OZEfEfH1s2XqPrL9SHaLJ1VRBPQaLb_FdAKPLI';
const baseUrl = 'https://sb-grsapzroyfcueysrmedk.supabase.co/rest/v1';

async function setupData() {
  try {
    // First, create a manufacturer
    console.log('📦 Creating manufacturer...');
    const mfrRes = await fetch(`${baseUrl}/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'manufacturer',
        company_name: 'TechCo Manufacturing Ltd',
        email: 'tech@mfr.com',
        is_approved: true,
        approval_status: 'approved',
        manufacturer_code: 'MFR-TECH001',
        subscription_plan: 'premium'
      })
    });

    const mfrData = await mfrRes.json();
    if (!mfrRes.ok) {
      console.log('❌ Manufacturer error:', mfrData);
      return;
    }
    console.log('✅ Manufacturer created:', mfrData[0]?.id);

    // Create products
    console.log('📦 Creating products...');
    const productsRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([
        {
          title: 'Industrial Motor 5HP',
          description: 'Heavy-duty industrial motor for manufacturing',
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
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
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
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
          manufacturer_id: '550e8400-e29b-41d4-a716-446655440001',
          category: 'Pumps',
          price_per_unit: 8500,
          currency: 'INR',
          moq: 2,
          unit: 'pcs',
          status: 'active'
        }
      ])
    });

    const prodData = await productsRes.json();
    if (!productsRes.ok) {
      console.log('❌ Products error:', prodData);
      return;
    }
    console.log(`✅ ${prodData.length || 0} products created`);

    // Create a buyer
    console.log('📦 Creating buyer...');
    const buyerRes = await fetch(`${baseUrl}/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440002',
        role: 'buyer',
        company_name: 'Global Trade Co',
        email: 'buyer@trade.com',
        is_approved: true,
        approval_status: 'approved',
        buyer_code: 'BYR-TRADE001',
        subscription_plan: 'basic'
      })
    });

    const buyerData = await buyerRes.json();
    if (!buyerRes.ok) {
      console.log('❌ Buyer error:', buyerData);
      return;
    }
    console.log('✅ Buyer created:', buyerData[0]?.id);

    console.log('\n✅ Test data setup complete!');
    console.log('\n🎯 Now you can:');
    console.log('   1. Login as buyer (buyer@trade.com / any password)');
    console.log('   2. Go to /buyer/browse to see 3 products');
    console.log('   3. See manufacturer codes (MFR-TECH001) instead of company names');
    console.log('   4. Add products to cart & place order');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

setupData();
