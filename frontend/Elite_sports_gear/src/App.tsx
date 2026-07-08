import { useEffect, useMemo, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import { API_BASE_URL } from './api'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

type Page = 'landing' | 'home' | 'products' | 'wishlist' | 'cart' | 'checkout' | 'orders'

type Product = {
  id: number
  name: string
  price: number
  category: string
  category_id?: number | null
  description: string
  featured?: boolean
  tag: string
  image?: string | null
}

// API_BASE_URL imported from src/api.ts

type OrderItem = {
  id: number
  product: Product
  quantity: number
  unit_price: number
}

type Order = {
  id: number
  user: number | null
  status: string
  total: number
  created_at: string
  updated_at: string
  items: OrderItem[]
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [catalog, setCatalog] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const currentPage = (location.pathname.replace('/', '') || 'landing') as Page
  const [wishlist, setWishlist] = useState<number[]>([1, 3])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderMessage, setOrderMessage] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('elite-auth-token'))
  const [authUser, setAuthUser] = useState<{ username: string | null; email: string | null }>(() => {
    const storedUser = localStorage.getItem('elite-auth-user')
    if (storedUser) {
      try {
        return JSON.parse(storedUser)
      } catch {
        return { username: null, email: null }
      }
    }
    return { username: null, email: null }
  })
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [accountMode, setAccountMode] = useState<'login' | 'register'>('login')
  const [authIsAdmin, setAuthIsAdmin] = useState<boolean>(false)
  const [categoryFilter, setCategoryFilter] = useState<number | string | null>(null)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/`)
        if (!response.ok) {
          throw new Error('Unable to fetch products')
        }
        const data = (await response.json()) as Product[]
        setCatalog(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    const loadOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/`)
        if (!response.ok) {
          throw new Error('Unable to fetch orders')
        }
        const data = (await response.json()) as Order[]
        setOrders(data)
      } catch (error) {
        console.error(error)
      } finally {
        setOrdersLoading(false)
      }
    }

    if (currentPage === 'home' || currentPage === 'products' || currentPage === 'wishlist' || currentPage === 'cart' || currentPage === 'checkout') {
      void loadProducts()
    }

    // load categories once and ensure desired set/order
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories/`)
        let data: Array<{ id: number; name: string }> = []
        if (res.ok) data = await res.json()

        const desired = ['jerseys', 'tracky', 'jackets', 'boots', 'balls', 'accessories']
        const byLower: Record<string, { id: number; name: string }> = {}
        data.forEach((c) => (byLower[c.name.toLowerCase()] = c))

        const ordered = desired.map((d) => {
          const found = byLower[d]
          return found ? { id: found.id, name: found.name } : { id: null as any, name: d }
        })
        setCategories(ordered)
      } catch (e) {
        // ignore
      }
    }

    void loadCategories()

    if (currentPage === 'orders') {
      void loadOrders()
    }
  }, [currentPage])

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('elite-auth-token', authToken)
    } else {
      localStorage.removeItem('elite-auth-token')
    }

    localStorage.setItem('elite-auth-user', JSON.stringify(authUser))
    // fetch user details (is_staff) when token changes
    const loadMe = async () => {
      if (!authToken) {
        setAuthIsAdmin(false)
        return
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/api/auth/me/`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Token ${authToken}` },
        })
        if (!resp.ok) {
          setAuthIsAdmin(false)
          return
        }
        const data = await resp.json()
        setAuthUser({ username: data.username, email: data.email })
        setAuthIsAdmin(Boolean(data.is_staff))
      } catch (e) {
        setAuthIsAdmin(false)
      }
    }
    void loadMe()
  }, [authToken, authUser])

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authToken) {
      headers.Authorization = `Token ${authToken}`
    }
    return headers
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    setAuthMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || 'Registration failed')
      }
      setAuthToken(data.token)
      setAuthUser({ username: data.username, email: data.email })
      setAuthMessage('Account created successfully. You are now logged in.')
      setAccountMode('login')
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Registration error')
    }
  }

  const handleLogin = async (username: string, password: string) => {
    setAuthMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || 'Login failed')
      }
      setAuthToken(data.token)
      setAuthUser({ username: data.username, email: data.email })
      setAuthMessage('Logged in successfully.')
      setAccountMode('login')
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Login error')
    }
  }

  const logout = () => {
    setAuthToken(null)
    setAuthUser({ username: null, email: null })
    setAuthMessage('You have been logged out.')
    setAccountMode('login')
    setAuthIsAdmin(false)
  }

  const cartItems = useMemo(
    () =>
      catalog
        .filter((product) => cart[product.id])
        .map((product) => ({ ...product, quantity: cart[product.id] })),
    [cart],
  )

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0),
    [cart],
  )

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  )

  const toggleWishlist = (id: number) => {
    setWishlist((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const addToCart = (id: number) => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }))
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart((current) => {
      const nextQuantity = (current[id] || 0) + delta
      if (nextQuantity <= 0) {
        const { [id]: _removed, ...rest } = current
        return rest
      }
      return { ...current, [id]: nextQuantity }
    })
  }

  const handleCheckout = async (checkoutData: {
    full_name: string
    email: string
    address: string
    payment_method: string
    phone?: string
  }) => {
    setOrderPlaced(false)
    setOrderMessage(null)

    if (cartItems.length === 0) {
      setOrderMessage('Your cart is empty. Add items before placing an order.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          full_name: checkoutData.full_name,
          email: checkoutData.email,
          address: checkoutData.address,
          phone: checkoutData.phone || '',
          payment_method: checkoutData.payment_method,
          items: cartItems.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to place order')
      }
      setOrderPlaced(true)
      setCart({})
      setOrderMessage(`Order #${data.id} placed. Confirmation sent to ${checkoutData.email}.`)
      return data
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Order submission failed')
      throw error
    }
  }

  const baseNav = [
    { key: 'home', label: 'Home' },
    { key: 'products', label: 'Products' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'cart', label: 'Cart' },
    { key: 'orders', label: 'Orders' },
  ]

  const navItems: { key: string; label: string }[] = authIsAdmin ? [...baseNav, { key: 'admin/products', label: 'Admin' }] : baseNav

  const goTo = (page: string) => navigate(page === 'home' ? '/home' : `/${page}`)

  return (
    <div className="app-shell">
      <Navbar currentPage={currentPage} navItems={navItems} onNavigate={goTo} cartCount={cartCount} />

      <main>
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={goTo} />} />
          <Route
            path="/home"
            element={
              <HomePage
                catalog={catalog}
                loading={loading}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                addToCart={addToCart}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
                onNavigate={goTo}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProductsPage
                catalog={catalog}
                loading={loading}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                addToCart={addToCart}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categories={categories}
              />
            }
          />
          <Route path="/wishlist" element={<WishlistPage catalog={catalog} wishlist={wishlist} addToCart={addToCart} />} />
          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                cartCount={cartCount}
                cartTotal={cartTotal}
                updateQuantity={updateQuantity}
                onNavigate={goTo}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                orderPlaced={orderPlaced}
                cartTotal={cartTotal}
                cartItems={cartItems}
                handleCheckout={handleCheckout}
                authToken={authToken}
                authUser={authUser}
                accountMode={accountMode}
                setAccountMode={setAccountMode}
                handleLogin={handleLogin}
                handleRegister={handleRegister}
                authMessage={authMessage}
                logout={logout}
                orderMessage={orderMessage}
              />
            }
          />
          <Route path="/admin/products" element={<AdminProducts authToken={authToken} />} />
          <Route path="/admin/orders" element={<AdminOrders authToken={authToken} />} />
          <Route path="/orders" element={<OrdersPage orders={orders} ordersLoading={ordersLoading} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
