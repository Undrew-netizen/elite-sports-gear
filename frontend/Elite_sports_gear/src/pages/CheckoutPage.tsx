interface CheckoutPageProps {
  orderPlaced: boolean
  cartTotal: number
  handleCheckout: (event: React.FormEvent<HTMLFormElement>) => void
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

export default function CheckoutPage({ orderPlaced, cartTotal, handleCheckout }: CheckoutPageProps) {
  return (
    <section className="checkout-layout">
      <div className="summary-card">
        <p className="eyebrow">Checkout</p>
        <h2>{orderPlaced ? 'Order confirmed!' : 'Complete your order'}</h2>
        {orderPlaced ? (
          <p>Your football gear order is on the way. A confirmation email will arrive shortly.</p>
        ) : (
          <form onSubmit={handleCheckout} className="checkout-form">
            <input type="text" placeholder="Full name" required />
            <input type="email" placeholder="Email address" required />
            <input type="text" placeholder="Delivery address" required />
            <button className="primary-btn wide" type="submit">
              Place order
            </button>
          </form>
        )}
      </div>
      <aside className="summary-card summary-card-large">
        <h3>Delivery estimate</h3>
        <p>Free shipping on orders over KES 10000.</p>
        <div className="summary-row">
          <span>Current total</span>
          <strong>{currency(cartTotal)}</strong>
        </div>
      </aside>
    </section>
  )
}
