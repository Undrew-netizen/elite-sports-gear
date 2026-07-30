import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api'

type Category = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
  price: number
  category: string
  category_id?: number | null
  description: string
  tag?: string
  image?: string | null
  featured?: boolean
}

export default function AdminProducts({ authToken }: { authToken: string | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [category, setCategory] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/`)
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      console.error(e)
      setMessage('Unable to load products')
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    void loadProducts()
    void loadCategories()
  }, [])

  const resetForm = () => {
    setSelectedId(null)
    setName('')
    setPrice('')
    setCategory('')
    setCategoryName('')
    setDescription('')
    setTag('')
    setFeatured(false)
    setImageFile(null)
    setMessage(null)
  }

  const createOrResolveCategory = async (): Promise<string | null> => {
    if (category === '__other') {
      const otherValue = categoryName.trim()
      if (!otherValue) {
        throw new Error('Please enter a category name')
      }

      const cRes = await fetch(`${API_BASE_URL}/api/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${authToken}` },
        body: JSON.stringify({ name: otherValue }),
      })
      if (!cRes.ok) {
        const dt = await cRes.json().catch(() => ({}))
        throw new Error(dt?.detail || 'Failed to create category')
      }
      const created = await cRes.json()
      await loadCategories()
      return String(created.id)
    }

    return category || null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authToken) {
      setMessage('Admin token required')
      return
    }

    try {
      const categoryIdToUse = await createOrResolveCategory()

      const fd = new FormData()
      fd.append('name', name)
      fd.append('price', String(price))
      if (categoryIdToUse) fd.append('category', categoryIdToUse)
      fd.append('description', description)
      fd.append('tag', tag)
      fd.append('featured', featured ? 'true' : 'false')
      if (imageFile) fd.append('image', imageFile)

      const url = selectedId ? `${API_BASE_URL}/api/products/${selectedId}/` : `${API_BASE_URL}/api/products/`
      const method = selectedId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Token ${authToken}` },
        body: fd,
      })

      if (!res.ok) {
        const dt = await res.json().catch(() => ({}))
        throw new Error(dt?.detail || 'Failed to save product')
      }

      setMessage(selectedId ? 'Product updated' : 'Product created')
      resetForm()
      void loadProducts()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error')
    }
  }

  const editProduct = (product: Product) => {
    setSelectedId(product.id)
    setName(product.name)
    setPrice(product.price)
    setCategory(product.category_id ? String(product.category_id) : '')
    setCategoryName('')
    setDescription(product.description)
    setTag(product.tag || '')
    setFeatured(Boolean(product.featured))
    setImageFile(null)
    setMessage(`Editing product #${product.id}`)
  }

  const deleteProduct = async (productId: number) => {
    if (!authToken) {
      setMessage('Admin token required')
      return
    }

    if (!window.confirm('Delete this product permanently?')) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${authToken}` },
      })
      if (!res.ok) {
        throw new Error('Could not delete product')
      }
      setMessage('Product deleted')
      void loadProducts()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error')
    }
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authToken) {
      setMessage('Admin token required')
      return
    }

    try {
      const categoryToCreate = categoryName.trim()
      if (!categoryToCreate) {
        setMessage('Category name is required')
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${authToken}` },
        body: JSON.stringify({ name: categoryToCreate }),
      })
      if (!res.ok) {
        const dt = await res.json().catch(() => ({}))
        throw new Error(dt?.detail || 'Failed to create category')
      }
      setCategoryName('')
      setMessage('Category created')
      void loadCategories()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <section className="admin-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Catalog control</p>
          <h2>Products and categories</h2>
          <p>Maintain your store catalog with a clear editor for products, media, pricing, and categories.</p>
        </div>
      </div>

      {message ? <div className="alert-message">{message}</div> : null}
      {!authToken ? (
        <div className="alert-message">Please log in as an admin to access this page.</div>
      ) : (
        <>
          <div className="admin-split-grid">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <p className="eyebrow">Product editor</p>
                  <h3>{selectedId ? 'Edit product' : 'Create product'}</h3>
                </div>
              </div>
              <form onSubmit={submit} className="admin-form">
                <div className="form-group">
                  <label>Product name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                </div>
                <div className="form-group">
                  <label>Price (KES)</label>
                  <input
                    value={price as any}
                    onChange={(e) => setPrice(Number(e.target.value) || '')}
                    placeholder="Price"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">-- select category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                    <option value="__other">Other (type below)</option>
                  </select>
                </div>
                {category === '__other' ? (
                  <div className="form-group">
                    <label>New category name</label>
                    <input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Category name"
                    />
                  </div>
                ) : null}
                <div className="form-group">
                  <label>Tag</label>
                  <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
                </div>
                <div className="form-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                    Featured product
                  </label>
                  <label className="file-label">
                    <span>Image</span>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="admin-form-actions">
                  <button className="primary-btn" type="submit">{selectedId ? 'Save product' : 'Create product'}</button>
                  {selectedId ? (
                    <button type="button" className="secondary-btn" onClick={resetForm}>Cancel edit</button>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <p className="eyebrow">Category manager</p>
                  <h3>Categories</h3>
                </div>
              </div>
              <form onSubmit={addCategory} className="admin-form">
                <div className="form-group">
                  <label>New category name</label>
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="New category name"
                    required
                  />
                </div>
                <button className="secondary-btn" type="submit">Add category</button>
              </form>
              <div className="category-list admin-panel-card">
                <h4>Existing categories</h4>
                <ul>
                  {categories.map((c) => (
                    <li key={c.id}>{c.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: '2rem' }}>
            <div>
              <p className="eyebrow">Inventory</p>
              <h3>Current product catalog</h3>
            </div>
          </div>

          <div className="card-grid admin-product-grid">
            {products.map((p) => (
              <article key={p.id} className="product-card admin-product-card">
                <div className="product-card-top-row">
                  <div>
                    <span className="tag">{p.category || 'Uncategorized'}</span>
                    {p.featured ? <span className="status-chip">Featured</span> : null}
                  </div>
                  <div className="product-price">KES {p.price}</div>
                </div>
                <img src={p.image || '/placeholder.svg'} className="product-image" alt={p.name} />
                <div>
                  <h4>{p.name}</h4>
                  <p>{p.description}</p>
                </div>
                <div className="admin-card-actions">
                  <button className="secondary-btn" type="button" onClick={() => editProduct(p)}>
                    Edit
                  </button>
                  <button className="danger-btn" type="button" onClick={() => deleteProduct(p.id)}>
                    Delete
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
