interface HomePageProps {
  catalog: Product[]
  loading: boolean
  wishlist: number[]
  toggleWishlist: (id: number) => void
  addToCart: (id: number) => void
  onNavigate: (page: string) => void
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

export default function HomePage({
  catalog,
  loading,
  wishlist,
  toggleWishlist,
  addToCart,
  onNavigate,
}: HomePageProps) {
  const featuredProducts = catalog.filter((product) => product.featured)

  return (
    <section>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Featured products</p>
          <h2>Top picks for the season</h2>
        </div>
        <button className="secondary-btn" onClick={() => onNavigate('products')}>
          Browse all gear
        </button>
      </div>
      {loading ? (
        <p>Loading featured gear…</p>
      ) : (
        <div className="card-grid">
          {featuredProducts.map((product) => (
            <article key={product.id} className="product-card">
              {product.image ? <img className="product-image" src={product.image} alt={product.name} /> : null}
              <div className="product-top">
                <span className="tag">{product.tag}</span>
                <button className="icon-btn" onClick={() => toggleWishlist(product.id)}>
                  {wishlist.includes(product.id) ? '♥' : '♡'}
                </button>
              </div>
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
