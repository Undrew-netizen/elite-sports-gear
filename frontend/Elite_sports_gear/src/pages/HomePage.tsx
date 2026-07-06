interface HomePageProps {
  catalog: Product[]
  loading: boolean
  wishlist: number[]
  toggleWishlist: (id: number) => void
  addToCart: (id: number) => void
  categoryFilter?: number | string | null
  setCategoryFilter?: (cat: number | string | null) => void
  categories?: Array<{ id: number | null; name: string }>
  onNavigate: (page: string) => void
}

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
  categoryFilter,
  setCategoryFilter,
  categories,
  onNavigate,
}: HomePageProps) {
  const cats = categories || []
  const featuredProducts = catalog
    .filter((product) => product.featured)
    .filter((product) => {
      if (!categoryFilter) return true
      if (typeof categoryFilter === 'number') return product.category_id === categoryFilter
      return (product.category || '').toLowerCase() === String(categoryFilter).toLowerCase()
    })

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
        <>
          <div className="category-list" style={{ marginBottom: 12 }}>
            <button className={`secondary-btn ${!categoryFilter ? 'active-tab' : ''}`} onClick={() => setCategoryFilter && setCategoryFilter(null)}>
              All
            </button>
            {cats.map((cat) => (
              <button
                key={cat.id ?? cat.name}
                className={`secondary-btn ${
                  (typeof categoryFilter === 'number' && categoryFilter === cat.id) ||
                  (typeof categoryFilter === 'string' && categoryFilter.toLowerCase() === cat.name.toLowerCase())
                    ? 'active-tab'
                    : ''
                }`}
                onClick={() => setCategoryFilter && setCategoryFilter(cat.id != null ? cat.id : cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="card-grid">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="product-card"
              style={
                categoryFilter
                  ? typeof categoryFilter === 'number'
                    ? product.category_id === categoryFilter
                      ? { border: '2px solid #0b74de' }
                      : undefined
                    : (product.category || '').toLowerCase() === String(categoryFilter).toLowerCase()
                    ? { border: '2px solid #0b74de' }
                    : undefined
                  : undefined
              }
            >
              <img className="product-image" src={product.image || '/placeholder.svg'} alt={product.name} />
              <div className="product-top">
                <span className="tag">{product.category}</span>
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
        </>
      )}
    </section>
  )
}
