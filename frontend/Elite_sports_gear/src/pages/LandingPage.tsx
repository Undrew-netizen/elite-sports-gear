interface LandingPageProps {
  onNavigate: (page: string) => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <section className="hero-section">
      <div>
        <p className="eyebrow">Elite Sports Gear</p>
        <h1>Gear up for every match with premium football essentials.</h1>
        <p className="hero-copy">
          Discover boots, gloves, training gear, and match-day apparel built for performance.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => onNavigate('products')}>
            Shop now
          </button>
          <button className="secondary-btn" onClick={() => onNavigate('home')}>
            Explore featured picks
          </button>
        </div>
      </div>
      <div className="hero-card">
        <h2>Why players love us</h2>
        <ul>
          <li>Fast shipping on all orders</li>
          <li>Trusted brands and athlete-tested gear</li>
          <li>Flexible checkout and easy wishlist saving</li>
        </ul>
      </div>
    </section>
  )
}
