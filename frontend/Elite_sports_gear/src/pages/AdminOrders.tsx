import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api'

const STATUS_OPTIONS = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'complete', label: 'Complete' },
]

export default function AdminOrders({ authToken }: { authToken: string | null }) {
  const [orders, setOrders] = useState<any[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/`, {
        headers: { Authorization: authToken ? `Token ${authToken}` : '' },
      })
      if (!res.ok) {
        const txt = await res.text()
        setMessage(`Error: ${res.status} ${txt}`)
        return
      }
      const data = await res.json()
      setOrders(data)
    } catch (e) {
      console.error(e)
      setMessage('Unable to load orders')
    }
  }

  useEffect(() => {
    void load()
  }, [authToken])

  const updateStatus = async (id: number, status: string) => {
    if (!authToken) {
      setMessage('Admin token required')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${authToken}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const dt = await res.text()
        throw new Error(dt || 'Update failed')
      }
      setMessage('Order status updated')
      void load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error')
    }
  }

  const cancelOrder = async (id: number) => {
    if (!authToken) {
      setMessage('Admin token required')
      return
    }
    if (!window.confirm('Delete this order permanently?')) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${authToken}` },
      })
      if (!res.ok) {
        const dt = await res.text()
        throw new Error(dt || 'Delete failed')
      }
      setMessage('Order deleted')
      void load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <section className="admin-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Order operations</p>
          <h2>Order management</h2>
          <p>Review recent orders, update fulfillment status, and remove invalid orders.</p>
        </div>
      </div>

      {message ? <div className="alert-message">{message}</div> : null}
      {!authToken ? (
        <div className="alert-message">Please log in as an admin to access this page.</div>
      ) : (
        <div className="admin-orders-grid">
          {orders.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <h4>Order #{o.id}</h4>
                  <p className="order-meta">{o.customer_name} · {o.customer_phone} · {o.customer_email}</p>
                </div>
                <span className="order-status">{o.status}</span>
              </div>
              <p className="order-address">{o.delivery_address}</p>
              <div>
                <strong>Total: KES {o.total}</strong>
              </div>
              <div className="order-items">
                {o.items.map((it: any) => (
                  <div key={it.id} className="order-item-row">
                    <span>{it.quantity} × {it.product.name}</span>
                    <span>KES {it.unit_price}</span>
                  </div>
                ))}
              </div>
              <div className="order-actions">
                <label>
                  Status:
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="danger-btn" type="button" onClick={() => cancelOrder(o.id)}>
                  Delete order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
