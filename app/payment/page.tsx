// app/payment/page.tsx
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Component that uses useSearchParams
function PaymentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const plan = searchParams.get('plan') || 'basic';
  const role = searchParams.get('role') || 'manufacturer';
  const amountParam = searchParams.get('amount');
  const billingCycle = searchParams.get('cycle') || 'monthly';

  const plans = {
    manufacturer: { basic: 2999, premium: 9999, enterprise: 29999 },
    buyer: { basic: 1999, premium: 4999 }
  };

  const amount = amountParam ? parseInt(amountParam) : (plans[role as keyof typeof plans]?.[plan as keyof typeof plans.manufacturer] || 0);
  const gst = amount * 0.18;
  const total = amount + gst;

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return }
    setUser(user);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile);
    setLoading(false);
  }

  async function handlePayment() {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const endDate = billingCycle === 'monthly' 
      ? new Date(Date.now() + 30*24*60*60*1000)
      : new Date(Date.now() + 365*24*60*60*1000);
    
    const { error } = await supabase.from('profiles').update({
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString().split('T')[0],
      subscription_end_date: endDate.toISOString().split('T')[0],
      subscription_amount: amount,
      trial_used: true
    }).eq('id', user.id);

    if (error) {
      alert('Upgrade failed: ' + error.message);
    } else {
      alert(`✅ Payment successful! Your ${plan} plan is now active.`);
      router.push(role === 'manufacturer' ? '/manufacturer/dashboard' : '/buyer/dashboard');
    }
    setProcessing(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 text-xs text-center rounded-lg">
          🔧 DEMO MODE: No actual payment will be charged
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Complete Payment</h1>
        <p className="text-center text-gray-500 mb-6">Subscribe to {plan} plan ({billingCycle})</p>
        
        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between"><span>Plan</span><span className="font-semibold capitalize">{plan}</span></div>
          <div className="flex justify-between"><span>Amount</span><span className="font-bold text-cyan-600">₹{amount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
          <div className="flex justify-between border-t pt-3"><span className="font-bold">Total</span><span className="font-bold text-xl text-cyan-600">₹{total.toLocaleString()}</span></div>
        </div>
        
        <button onClick={handlePayment} disabled={processing} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
          {processing ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
        </button>
        
        <button onClick={() => router.back()} className="w-full mt-3 text-gray-500 text-sm hover:underline">
          ← Back
        </button>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading payment details...</div>}>
      <PaymentForm />
    </Suspense>
  );
}