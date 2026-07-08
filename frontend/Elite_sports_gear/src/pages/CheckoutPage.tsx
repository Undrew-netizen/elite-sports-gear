import { useEffect, useState } from 'react'

interface CheckoutPageProps {
  orderPlaced: boolean
  cartTotal: number
  cartItems: Array<{ id: number; name: string; price: number; quantity: number; image?: string | null }>
  authToken: string | null
  authUser: { username: string | null; email: string | null }
  accountMode: 'login' | 'register'
  setAccountMode: (mode: 'login' | 'register') => void
  handleLogin: (username: string, password: string) => Promise<void>
  handleRegister: (username: string, email: string, password: string) => Promise<void>
  authMessage: string | null
  logout: () => void
  handleCheckout: (checkoutData: {
    full_name: string
    email: string
    address: string
    payment_method: string
    phone?: string
  }) => Promise<any>
  orderMessage: string | null
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

const WHATSAPP_NUMBER = '254791808323'

export default function CheckoutPage({
  orderPlaced,
  cartTotal,
  cartItems,
  authToken,
  authUser,
  accountMode,
  setAccountMode,
  handleLogin,
  handleRegister,
  authMessage,
  logout,
  handleCheckout,
  orderMessage,
}: CheckoutPageProps) {
  const [fullName, setFullName] = useState(authUser.username ?? '')
  const [email, setEmail] = useState(authUser.email ?? '')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  useEffect(() => {
    setEmail(authUser.email ?? '')
    setFullName(authUser.username ?? '')
  }, [authUser])

  const buildWhatsAppUrl = (orderId: number | string, normalizedPhone: string) => {
    const itemLines = cartItems.flatMap((item) => {
      const lines = [`- ${item.quantity} x ${item.name} @ ${currency(item.price)}`]
      if (item.image) {
        lines.push(`  Image: ${item.image}`)
      }
      return lines
    })
    const message = [
      'Hello Elite Sports Gear, I have placed an order.',
      '',
      `Order: #${orderId}`,
      `Name: ${fullName}`,
      `Phone: ${normalizedPhone}`,
      `Email: ${email}`,
      `Delivery address: ${address}`,
      '',
      'Items:',
      ...itemLines,
      '',
      `Total: ${currency(cartTotal)}`,
    ].join('\n')

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  }

  const submitCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const v = phone.trim()
    const m = v.match(/^(?:\+?254|0)(7\d{8})$/)
    if (!m) {
      setCheckoutMessage('Invalid phone. Use 07XXXXXXXX or 2547XXXXXXXX format.')
      return
    }
    const normalizedPhone = '254' + m[1]
    setCheckoutMessage(null)

    try {
      const result = await handleCheckout({
        full_name: fullName,
        email,
        address,
        payment_method: 'whatsapp',
        phone: normalizedPhone,
      })

      if (result?.id) {
        window.location.href = buildWhatsAppUrl(result.id, normalizedPhone)
      }
    } catch (err) {
      // handle error already set in App state
    }
  }

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleLogin(loginUsername, loginPassword)
  }

  const submitRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleRegister(registerUsername, registerEmail, registerPassword)
  }

  return (
    <section className="checkout-layout">
      <div className="summary-card">
        <p className="eyebrow">Checkout</p>
        <h2>{orderPlaced ? 'Order placed!' : 'Secure your gear'}</h2>
        {orderMessage ? <div className="alert-message">{orderMessage}</div> : null}
        {orderPlaced ? (
          <p>Your order was saved. WhatsApp will open with the order details ready to send.</p>
        ) : (
          <>
            {authMessage ? <div className="alert-message">{authMessage}</div> : null}
            {authToken ? (
              <div className="account-chip">
                <strong>Logged in as</strong> {authUser.username || authUser.email}
                <button className="secondary-btn" type="button" onClick={logout}>
                  Log out
                </button>
              </div>
            ) : (
              <div className="checkout-tabs">
                <button
                  className={`secondary-btn ${accountMode === 'login' ? 'active-tab' : ''}`}
                  type="button"
                  onClick={() => setAccountMode('login')}
                >
                  Login
                </button>
                <button
                  className={`secondary-btn ${accountMode === 'register' ? 'active-tab' : ''}`}
                  type="button"
                  onClick={() => setAccountMode('register')}
                >
                  Create account
                </button>
              </div>
            )}

            {accountMode === 'login' && !authToken ? (
              <form onSubmit={submitLogin} className="checkout-form">
                <input
                  type="text"
                  placeholder="Username or email"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button className="primary-btn wide" type="submit">
                  Login
                </button>
              </form>
            ) : accountMode === 'register' && !authToken ? (
              <form onSubmit={submitRegister} className="checkout-form">
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
                <button className="primary-btn wide" type="submit">
                  Create account
                </button>
              </form>
            ) : (
              <form onSubmit={submitCheckout} className="checkout-form">
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Delivery address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Phone (e.g. 07XXXXXXXX)"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button className="primary-btn wide" type="submit">
                  Continue to WhatsApp
                </button>
                {checkoutMessage ? <div className="alert-message">{checkoutMessage}</div> : null}
              </form>
            )}
          </>
        )}
      </div>
      <aside className="summary-card summary-card-large">
        <div className="summary-stack">
          <h3>Order summary</h3>
          <p className="hero-copy">Review your selected gear and send the order details on WhatsApp.</p>
          <div className="summary-row">
            <span>Items</span>
            <strong>{cartItems.length}</strong>
          </div>
          <div className="summary-row">
            <span>Current total</span>
            <strong>{currency(cartTotal)}</strong>
          </div>
        </div>
        <div className="cart-preview">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-preview-item">
              <img className="product-image small" src={item.image || '/placeholder.svg'} alt={item.name} />
              <div>
                <strong>{item.name}</strong>
                <p>{item.quantity} x {currency(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  )
}
