import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../api'

type Product = {
  id: number
  name: string
  price: number
  category: string
  category_id?: number | null
  description: string
  tag?: string
  image?: string | null
}

export default function AdminProducts({ authToken }: { authToken: string | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/`)
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      console.error(e)
    }
    // load categories
    try {
      const c = await fetch(`${API_BASE_URL}/api/categories/`)
      if (c.ok) {
        const cd = await c.json()
        setCategories(cd)
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authToken) {
      setMessage('Admin token required')
      return
    }
    try {
      // if the user entered a new category, create it first via API
      let categoryIdToUse: string | null = null
      if (category === '__other') {
        const otherValue = (document.getElementById('other-category') as HTMLInputElement)?.value || ''
        if (!otherValue) {
          setMessage('Please enter a category name')
          return
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
        categoryIdToUse = String(created.id)
      } else {
        categoryIdToUse = category || null
      }

      const fd = new FormData()
      fd.append('name', name)
      fd.append('price', String(price))
      if (categoryIdToUse) fd.append('category', categoryIdToUse)
      fd.append('description', description)
      fd.append('tag', tag)
      fd.append('featured', featured ? 'true' : '')
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch(`${API_BASE_URL}/api/products/`, {
        method: 'POST',
        headers: { Authorization: `Token ${authToken}` },
        body: fd,
      })
      if (!res.ok) {
        const dt = await res.json().catch(() => ({}))
        throw new Error(dt?.detail || 'Failed to create product')
      }

      setMessage('Product created')
      setName('')
      setPrice('')
      setCategory('')
      setDescription('')
      setTag('')
      setFeatured(false)
      setImageFile(null)
      void load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <section>
      <h2>Admin — Products</h2>
      {message ? <div className="alert-message">{message}</div> : null}
      <form onSubmit={submit} className="admin-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input value={price as any} onChange={(e) => setPrice(Number(e.target.value) || '')} placeholder="Price" required />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">-- select category --</option>
          {categories.filter(c => c.id != null).map((c) => (
            <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
          ))}
          <option value="__other">Other (type below)</option>
        </select>
        {category === '__other' ? (
          <input id="other-category" placeholder="Category" />
        ) : null}
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <label><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        <button className="primary-btn" type="submit">Create product</button>
      </form>

      <h3>Existing products</h3>
      <div className="card-grid">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            <img src={p.image || '/placeholder.svg'} className="product-image" alt={p.name} />
            <div className="product-top">
              <span className="tag">{p.category}</span>
            </div>
            <h4>{p.name}</h4>
            <p>{p.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
