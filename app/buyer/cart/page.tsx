'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCart()
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    setLoading(false)
  }

  function loadCart() {
    const savedCart = localStorage.getItem('midlync_cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  function saveCart(newCart) {
    setCart(newCart)
    localStorage.setItem('midlync_cart', JSON.stringify(newCart))
  }

  function updateQuantity(productId, quantity) {
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    )
    saveCart(newCart)
  }

  function removeItem(productId) {
    const newCart = cart.filter(item => item.id !== productId)
    saveCart(newCart)
  }

  function getTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  async function placeOrder() {
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    setPlacing(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Please login to place order')
      router.push('/login')
      return
    }

    const orderNumber = 'ORD-' + Date.now()
    
    // Create order for each product (or single order with multiple items)
    for (const item of cart) {
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        manufacturer_id: item.manufacturer_id,
        buyer_id: user.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: item.price * item.quantity,
        currency: 'USD',
        stage: 1,
        stage_name: 'Order Placed',
        status: 'pending'
      })

      if (error) {
        console.error('Order error:', error)
        alert('Error placing order: ' + error.message)
        setPlacing(false)
        return
      }
    }

    // Clear cart
    localStorage.removeItem('midlync_cart')
    setCart([])
    
    // Send notification to manufacturer
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: cart[0]?.manufacturer_id,
        title: 'New Order Received',
        message: `Order ${orderNumber} placed by ${profile?.company_name}`,
        type: 'order',
        metadata: { orderNumber }
      })
    })

    alert('Order placed successfully!')
    router.push('/buyer/orders')
    setPlacing(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <button onClick={() => router.push('/buyer/browse')} className="text-cyan-600">Continue Shopping →</button>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-slate-500 mb-4">Your cart is empty</p>
            <button onClick={() => router.push('/buyer/browse')} className="bg-cyan-600 text-white px-6 py-3 rounded-xl">
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-left">Price</th>
                    <th className="p-4 text-left">Quantity</th>
                    <th className="p-4 text-left">Total</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image && <img src={item.image} className="w-12 h-12 object-cover rounded" />}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">${item.price}</td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="p-4">${(item.price * item.quantity).toFixed(2)}</td>
                      <td className="p-4">
                        <button onClick={() => removeItem(item.id)} className="text-red-500">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan="3" className="p-4 text-right font-bold">Total:</td>
                    <td className="p-4 font-bold text-xl text-cyan-600">${getTotal().toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={placeOrder} 
                disabled={placing}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {placing ? 'Placing Order...' : 'Proceed to Checkout →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}