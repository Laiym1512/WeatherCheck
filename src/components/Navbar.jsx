import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'


function SunIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
      </g>
    </svg>
  )
}

function MoonIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"
      />
    </svg>
  )
}

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav className="navbar">
      <span className="navbar-brand">Test App</span>
      <div className="navbar-links">
        <button
          type="button"
          className="navbar-theme-toggle btn btn-sm"
          onClick={toggleTheme}
          aria-pressed={isDark}
          title="Toggle light / dark theme"
        >
          {isDark ? <SunIcon className="navbar-theme-icon" /> : <MoonIcon className="navbar-theme-icon" />}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
