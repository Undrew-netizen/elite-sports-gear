import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../api'

type AdminDashboardProps = {
  authToken: string | null
}

type Stats = {
  productCount: number
  orderCount: number
  categoryCount: number
}

export default function AdminDashboard({ authToken }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({ productCount: 0, orderCount: 0, categoryCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/`),
          fetch(`${API_BASE_URL}/api/categories/`),
          fetch(`${API_BASE_URL}/api/orders/`, {
            headers: { Authorization: authToken ? `Token ${authToken}` : '' },
          }),
        ])
        const products = productsRes.ok ? await productsRes.json() : []
        const categories = categoriesRes.ok ? await categoriesRes.json() : []
        const orders = ordersRes.ok ? await ordersRes.json() : []

        setStats({
          productCount: Array.isArray(products) ? products.length : 0,
          categoryCount: Array.isArray(categories) ? categories.length : 0,
          orderCount: Array.isArray(orders) ? orders.length : 0,
        })
      } catch (err) {
        setError('Unable to load admin stats')
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [])

  return (
    <section className="admin-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Administrator dashboard</p>
          <h2>Store management center</h2>
          <p>Quickly access product controls, category workflow, and order operations from one admin panel.</p>
        </div>
      </div>

      <div className="admin-summary-grid">
        <article className="admin-card">
          <h3>Catalog overview</h3>
          <p>Know your store size at a glance and jump straight into product management.</p>
          <div className="admin-stat-row">
            <span>Products</span>
            <strong>{stats.productCount}</strong>
          </div>
          <div className="admin-stat-row">
            <span>Categories</span>
            <strong>{stats.categoryCount}</strong>
          </div>
          <Link className="primary-btn" to="/admin/products">
            Open product manager
          </Link>
        </article>

        <article className="admin-card">
          <h3>Order control</h3>
          <p>Manage order flow quickly and update status on active customer orders.</p>
          <div className="admin-stat-row">
            <span>Total orders</span>
            <strong>{stats.orderCount}</strong>
          </div>
          <Link className="secondary-btn" to="/admin/orders">
            Open order manager
          </Link>
        </article>

        <article className="admin-card">
          <h3>Quick actions</h3>
          <p>Use these links to maintain categories and keep your catalog organized.</p>
          <Link className="secondary-btn" to="/admin/products">
            Manage categories
          </Link>
          {error ? <div className="alert-message">{error}</div> : null}
          {loading ? <p>Loading stats…</p> : null}
        </article>
      </div>
    </section>
  )
}
