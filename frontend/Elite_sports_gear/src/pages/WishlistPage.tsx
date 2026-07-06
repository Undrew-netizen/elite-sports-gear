interface WishlistPageProps {
  catalog: Product[]
  wishlist: number[]
  addToCart: (id: number) => void
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

const currency = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

export default function WishlistPage({ catalog, wishlist, addToCart }: WishlistPageProps) {
  const wishlistItems = catalog.filter((product) => wishlist.includes(product.id))

  return (
    <section>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Wishlist</p>
          <h2>Your saved gear</h2>
        </div>
      </div>
      {wishlistItems.length === 0 ? (
        <div className="empty-state">
          <h3>No items saved yet.</h3>
          <p>Tap the heart icon on any product to keep it for later.</p>
        </div>
      ) : (
        <div className="card-grid">
          {wishlistItems.map((product) => (
            <article key={product.id} className="product-card">
              <img className="product-image" src={product.image || '/placeholder.svg'} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="card-footer">
                <strong>{currency(product.price)}</strong>
                <button className="primary-btn" onClick={() => addToCart(product.id)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
