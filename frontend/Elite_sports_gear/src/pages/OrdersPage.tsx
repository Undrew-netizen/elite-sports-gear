interface OrdersPageProps {
  orders: Order[]
  ordersLoading: boolean
}

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

const currency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

export default function OrdersPage({ orders, ordersLoading }: OrdersPageProps) {
  return (
    <section>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Your orders</p>
          <h2>Track your recent orders</h2>
        </div>
      </div>
      {ordersLoading ? (
        <p>Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet.</h3>
          <p>Place an order to see it listed here.</p>
        </div>
      ) : (
        <div className="card-grid">
          {orders.map((order) => (
            <article key={order.id} className="product-card">
              <h3>Order #{order.id}</h3>
              <p>Status: {order.status}</p>
              <p>Placed: {new Date(order.created_at).toLocaleString()}</p>
              <div className="card-footer">
                <strong>{currency(order.total)}</strong>
                <div>
                  {order.items.map((it) => (
                    <div key={it.id}>{it.quantity} × {it.product.name}</div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
