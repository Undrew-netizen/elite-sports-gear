import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={logo} alt="logo" style={{ height: 100}} />
        <p>Elite Sports Gear • Boots, balls, gloves, and training essentials.</p>
      </div>
      <p>0791808323</p>
      
    </footer>
  )
}
