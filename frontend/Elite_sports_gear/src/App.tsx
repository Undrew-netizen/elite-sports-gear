import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import WishlistPage from './pages/WishlistPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

type Page = 'landing' | 'home' | 'products' | 'wishlist' | 'cart' | 'checkout' | 'orders'

type Product = {
  id: number
  name: string
  price: number
  category: string
  description: string
  featured?: boolean
  tag: string
  image?: string | null
}

const API_BASE_URL = 'http://127.0.0.1:8000'

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
  const [cart, setCart] = useState<Record<number, number>>({ 2: 1, 4: 2 })
  const [orderPlaced, setOrderPlaced] = useState(false)

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

    if (currentPage === 'home' || currentPage === 'products' || currentPage === 'wishlist') {
      void loadProducts()
    }

    if (currentPage === 'orders') {
      void loadOrders()
    }
  }, [currentPage])

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

  const handleCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOrderPlaced(true)
    setCart({})
  }

  const navItems: { key: Page; label: string }[] = [
    { key: 'landing', label: 'Landing' },
    { key: 'home', label: 'Home' },
    { key: 'products', label: 'Products' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'cart', label: 'Cart' },
    { key: 'checkout', label: 'Checkout' },
    { key: 'orders', label: 'Orders' },
  ]

  const goTo = (page: string) => navigate(page === 'landing' ? '/' : `/${page}`)

  return (
    <div className="app-shell">
      <Navbar currentPage={currentPage} navItems={navItems} onNavigate={goTo} />

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
            element={<CheckoutPage orderPlaced={orderPlaced} cartTotal={cartTotal} handleCheckout={handleCheckout} />}
          />
          <Route path="/orders" element={<OrdersPage orders={orders} ordersLoading={ordersLoading} />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App

