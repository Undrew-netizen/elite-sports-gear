import logo from "../assets/logo.gif";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src={logo} alt="logo" className="footer-logo" />
        <div>
          <p className="footer-title">Elite Sports Gear</p>
          <p className="footer-motto">Quality is our middle name.</p>
          <p>Premium football gear, match-day essentials, and trusted service delivered fast.</p>
        </div>
      </div>
      <div className="footer-links">
        <div>
          <p>Shop</p>
          <Link to="/home">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <p>Support</p>
          <span>Secure checkout</span>
          <span>Order confirmation by email</span>
          <span>Fast local delivery</span>
          <span>M-Pesa and card payments</span>
        </div>
        <div>
          <p>Contact</p>
          <a href="tel:+254791808323">0791 808 323</a>
          <a href="mailto:elitesportsgear254@gmail.com">elitesportsgear254@gmail.com</a>
          <a
            href="https://wa.me/254791808323?text=Hello%20Elite%20Sports%20Gear%2C%20I%20would%20like%20to%20make%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
        <div>
          <p>Business hours</p>
          <span>Monday - Saturday</span>
          <span>8:00 AM - 6:00 PM</span>
          <span>Online orders open 24/7</span>
          <span>Nairobi, Kenya</span>
        </div>
      </div>
      <div className="footer-note">
        <p>Secure payments via M-Pesa and card. Your order details are emailed to you and our store.</p>
        <p>&copy; {year} Elite Sports Gear. All rights reserved.</p>
      </div>
    </footer>
  )
}
