import logo from '../assets/logo.gif';


interface NavbarProps {
  currentPage: string
  navItems: Array<{ key: string; label: string }>
  onNavigate: (page: string) => void
  cartCount?: number
}

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
      )
    case 'products':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      )
    case 'wishlist':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>
      )
    case 'cart':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="20" cy="20" r="1"/><path d="M1 1h4l2.4 12.6a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L23 6H6"/></svg>
      )
    case 'checkout':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5V6a2 2 0 0 0-2-2H5v13h9"/><path d="M7 21h10"/><path d="M16 3v4"/></svg>
      )
    case 'orders':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H5v13h13"/><path d="M7 21h10"/></svg>
      )
    default:
      return null
  }
}

export default function Navbar({ currentPage, navItems, onNavigate, cartCount = 0 }: NavbarProps) {
  return (
    <nav className="top-nav">
      <button className="brand-btn" onClick={() => onNavigate('home')}>
        <img src={logo} alt="Logo" style={{ height: 56, width: 56, marginRight: 8 }} />
        <span>ELITE SPORTS GEAR</span>
      </button>
      <div className="nav-links">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
            title={item.label}
          >
            <span className="icon"><Icon name={item.key} /></span>
            {item.key === 'cart' ? (
              <span className="cart-label">{item.label} <span className="cart-count">{cartCount}</span></span>
            ) : (
              <span className="nav-label">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
