'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function SubscriptionPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const router = useRouter()
  const supabase = createClient()

  const plans = {
    manufacturer: {
      free: { monthly: 0, yearly: 0, features: ['1 Product', 'Basic Support'] },
      basic: { monthly: 2999, yearly: 28790, features: ['50 Products', 'Email Support', 'Basic Analytics'] },
      premium: { monthly: 9999, yearly: 95990, features: ['500 Products', 'Priority Support', 'Advanced Analytics'] },
      enterprise: { monthly: 29999, yearly: 287990, features: ['Unlimited Products', '24/7 Support', 'API Access'] }
    },
    buyer: {
      free: { monthly: 0, yearly: 0, features: ['Browse Products', '5 Inquiries/month'] },
      basic: { monthly: 1999, yearly: 19190, features: ['Unlimited Inquiries', 'Sample Requests', 'Wishlist'] },
      premium: { monthly: 4999, yearly: 47990, features: ['RFQ Access', 'Priority Support', 'Volume Discounts'] }
    }
  }

  useEffect(() => {
    getUser()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profile)
    setLoading(false)
  }

  // ✅ FIXED: Redirect to payment page instead of direct upgrade
  async function handleUpgrade(planName: string) {
    setUpgrading(true)
    
    const amount = billingCycle === 'monthly' 
      ? plans[profile?.role as keyof typeof plans][planName as keyof typeof plans.manufacturer]?.monthly
      : plans[profile?.role as keyof typeof plans][planName as keyof typeof plans.manufacturer]?.yearly
    
    // Redirect to payment page
    router.push(`/payment?plan=${planName}&role=${profile?.role}&amount=${amount}&cycle=${billingCycle}`)
    
    setUpgrading(false)
  }

  const isTrialValid = () => {
    if (!profile?.trial_end_date) return false
    return new Date(profile.trial_end_date) > new Date()
  }

  const daysLeft = () => {
    if (!profile?.trial_end_date) return 0
    const diff = new Date(profile.trial_end_date).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const currentPlan = profile?.subscription_plan || 'free'
  const isOnTrial = profile?.subscription_status === 'trial' && isTrialValid()
  const trialDaysRemaining = daysLeft()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role={profile?.role} companyName={profile?.company_name || 'User'} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">💰 Subscription & Billing</h1>
        <p className="text-gray-500 mb-6">Manage your plan and billing information</p>

        {/* Current Plan Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">Current Plan</h2>
              <p className="text-3xl font-bold text-cyan-600 mt-1 capitalize">{currentPlan}</p>
              {isOnTrial ? (
                <p className="text-green-600 mt-2">🎉 {trialDaysRemaining} days left in free trial</p>
              ) : profile?.subscription_status === 'active' ? (
                <p className="text-gray-500 mt-2">Valid till: {profile?.subscription_end_date ? new Date(profile.subscription_end_date).toLocaleDateString() : 'N/A'}</p>
              ) : (
                <p className="text-red-500 mt-2">⚠️ Your plan has expired. Please upgrade to continue.</p>
              )}
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className={`font-medium ${billingCycle === 'monthly' ? 'text-cyan-600' : 'text-gray-500'}`}>Monthly</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} 
            className="relative w-14 h-7 bg-gray-300 rounded-full transition cursor-pointer"
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${billingCycle === 'yearly' ? 'right-1 bg-cyan-600' : 'left-1'}`}></div>
          </button>
          <span className={`font-medium ${billingCycle === 'yearly' ? 'text-cyan-600' : 'text-gray-500'}`}>
            Yearly <span className="text-xs text-green-600">(Save 20%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans[profile?.role as keyof typeof plans] || plans.manufacturer).map(([planKey, planData]) => {
            const price = billingCycle === 'monthly' ? planData.monthly : planData.yearly
            const isCurrentPlan = currentPlan === planKey
            
            // Skip free plan if already on paid plan
            if (planKey === 'free' && currentPlan !== 'free') return null
            
            return (
              <div key={planKey} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition ${isCurrentPlan ? 'border-cyan-500' : 'border-gray-100'}`}>
                {isCurrentPlan && <div className="bg-cyan-500 text-white text-center py-1 text-sm">CURRENT PLAN</div>}
                <div className="p-6">
                  <h3 className="text-xl font-bold capitalize">{planKey}</h3>
                  {price > 0 ? (
                    <div className="mt-4">
                      <span className="text-4xl font-bold">₹{price.toLocaleString()}</span>
                      <span className="text-gray-500">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-gray-500">Free</span>
                    </div>
                  )}
                  <ul className="mt-4 space-y-2">
                    {planData.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">✅ {feature}</li>
                    ))}
                  </ul>
                  {price > 0 && !isCurrentPlan && (
                    <button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={upgrading}
                      className="w-full mt-6 py-2 rounded-lg font-semibold transition bg-cyan-600 text-white hover:bg-cyan-700"
                    >
                      Upgrade to {planKey}
                    </button>
                  )}
                  {price === 0 && isCurrentPlan && (
                    <button
                      disabled
                      className="w-full mt-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Free Plan
                    </button>
                  )}
                  {price > 0 && isCurrentPlan && (
                    <button
                      disabled
                      className="w-full mt-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
          <h3 className="font-semibold mb-3">📜 Payment History</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div><p className="font-medium">Free Trial</p><p className="text-xs text-gray-400">Started on registration</p></div>
              <span className="text-green-600">₹0</span>
            </div>
            {profile?.subscription_status === 'active' && profile?.subscription_amount > 0 && (
              <div className="flex justify-between items-center border-b pb-2">
                <div><p className="font-medium capitalize">{currentPlan} Plan</p><p className="text-xs text-gray-400">Active since {profile.subscription_start_date ? new Date(profile.subscription_start_date).toLocaleDateString() : 'N/A'}</p></div>
                <span className="text-green-600">₹{profile.subscription_amount}/month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}