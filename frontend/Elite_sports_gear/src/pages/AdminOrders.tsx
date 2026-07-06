import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api'

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
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    if (!authToken) return setMessage('Admin token required')
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${authToken}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setMessage('Updated')
      void load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <section>
      <h2>Admin — Orders</h2>
      {message ? <div className="alert-message">{message}</div> : null}
      <div>
        {orders.map((o) => (
          <div key={o.id} className="order-card">
            <h4>Order #{o.id} — {o.status}</h4>
            <p>{o.customer_name} — {o.customer_phone} — {o.customer_email}</p>
            <div>
              <strong>Total: KES {o.total}</strong>
            </div>
            <div className="order-items">
              {o.items.map((it: any) => (
                <div key={it.id}>{it.quantity} x {it.product.name}</div>
              ))}
            </div>
            <div className="order-actions">
              <button className="secondary-btn" onClick={() => updateStatus(o.id, 'confirmed')}>Mark confirmed</button>
              <button className="secondary-btn" onClick={() => updateStatus(o.id, 'complete')}>Mark complete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
