import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './NavBar.css'; // Optional CSS file for styling

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>
      <ul className={`nav-links ${isOpen ? 'show' : ''}`}>
        <li><NavLink to="/" end className="nav-link" onClick={() => setIsOpen(false)}>Leaderboard</NavLink></li>
        <li><NavLink to="/player" className="nav-link" onClick={() => setIsOpen(false)}>Player</NavLink></li>
        <li><NavLink to="/admin" className="nav-link" onClick={() => setIsOpen(false)}>Admin</NavLink></li>
        <li><NavLink to="/login" className="nav-link" onClick={() => setIsOpen(false)}>Login</NavLink></li>
      </ul>
    </nav>
  );
}

export default NavBar;
