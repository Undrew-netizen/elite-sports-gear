interface CartPageProps {
  cartItems: Array<{
    id: number
    name: string
    price: number
    quantity: number
  }>
  cartCount: number
  cartTotal: number
  updateQuantity: (id: number, delta: number) => void
  onNavigate: (page: string) => void
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

export default function CartPage({ cartItems, cartCount, cartTotal, updateQuantity, onNavigate }: CartPageProps) {
  return (
    <section className="checkout-layout">
      <div>
        <div className="page-intro">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Items ready to checkout</h2>
          </div>
        </div>
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <h3>Your cart is empty.</h3>
            <p>Add some gear and come back here to finish your order.</p>
          </div>
        ) : (
          <div className="stacked-list">
            {cartItems.map((item) => (
              <div key={item.id} className="summary-card">
                <div>
                  <h3>{item.name}</h3>
                  <p>{currency(item.price)} each</p>
                </div>
                <div className="quantity-row">
                  <button className="icon-btn" onClick={() => updateQuantity(item.id, -1)}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button className="icon-btn" onClick={() => updateQuantity(item.id, 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="summary-card summary-card-large">
        <h3>Order summary</h3>
        <div className="summary-row">
          <span>Items</span>
          <strong>{cartCount}</strong>
        </div>
        <div className="summary-row">
          <span>Total</span>
          <strong>{currency(cartTotal)}</strong>
        </div>
        <button className="primary-btn wide" onClick={() => onNavigate('checkout')}>
          Proceed to checkout
        </button>
      </aside>
    </section>
  )
}
