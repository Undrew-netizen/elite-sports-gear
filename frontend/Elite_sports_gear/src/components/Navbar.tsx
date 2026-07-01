import logo from '../assets/logo.png';


interface NavbarProps {
  currentPage: string
  navItems: Array<{ key: string; label: string }>
  onNavigate: (page: string) => void
}

export default function Navbar({ currentPage, navItems, onNavigate }: NavbarProps) {
  return (
    <nav className="top-nav">
      <button className="brand-btn" onClick={() => onNavigate('landing')}>
       <p> <img src={logo} alt="Logo" style={{ height: 100}} /> <br />
        ELITE SPORTS GEAR</p>
      </button>
      <div className="nav-links">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-btn ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
