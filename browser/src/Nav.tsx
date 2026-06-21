import React from 'react';
import { NavLink } from 'react-router-dom';
import './Nav.css';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'navLink active' : 'navLink';

function Nav(): JSX.Element {
  return (
    <nav className="nav">
      <span className="navTitle">🐯 Tigers &amp; Goats 🐐</span>
      <div className="navLinks">
        <NavLink to="/" end className={linkClass}>
          Play
        </NavLink>
        <NavLink to="/rules" className={linkClass}>
          Rules
        </NavLink>
        <NavLink to="/strategies" className={linkClass}>
          Strategies
        </NavLink>
      </div>
    </nav>
  );
}

export default Nav;
