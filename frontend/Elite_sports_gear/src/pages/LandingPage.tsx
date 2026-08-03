interface LandingPageProps {
  onNavigate: (page: string) => void
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <section className="hero-section">
      <div>
        <p className="eyebrow">Built for match day</p>
        <h1>Perform at your best.<br /><em>Look like you mean it.</em></h1>
        <p className="hero-copy">
          Premium boots, jerseys and training essentials for footballers who bring energy to every game.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => onNavigate('products')}>
            Shop the collection <span aria-hidden="true">→</span>
          </button>
          <button className="secondary-btn" onClick={() => onNavigate('products')}>
            Explore all gear
          </button>
        </div>
        <div className="hero-highlights">
          <span>✓ Simple WhatsApp checkout</span>
          <span>✓ Fast delivery across Kenya</span>
          <span>✓ Shop without an account</span>
        </div>
      </div>
      <div className="hero-card hero-card-strong">
        <p className="hero-card-kicker">ELITE STANDARD</p>
        <h2>Everything you need to own the pitch.</h2>
        <ul>
          <li><strong>Trusted brands</strong><span>Gear selected for real performance.</span></li>
          <li><strong>Quick delivery</strong><span>From our store to your doorstep.</span></li>
          <li><strong>Easy checkout</strong><span>Send your order directly on WhatsApp.</span></li>
        </ul>
      </div>
    </section>
  )
}
