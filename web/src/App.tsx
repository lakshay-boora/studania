import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import Practice from './pages/Practice';
import Planner from './pages/Planner';
import Dash from './pages/Dash';
import { api, type Stats } from './lib/api';

const NAV = [
  { to: '/doubt', label: 'Doubt Saathi', emoji: '💬' },
  { to: '/practice', label: 'Practice', emoji: '🎯' },
  { to: '/planner', label: 'Planner', emoji: '🗓️' },
  { to: '/dash', label: 'My Dash', emoji: '📊' },
];

function Navbar() {
  const [streak, setStreak] = useState<number | null>(null);
  const [exam, setExam] = useState('JEE');
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    if (location.pathname === '/') return;
    api.stats().then((s: Stats) => {
      setStreak(s.user.streak);
      setExam(s.user.exam);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Angvey home">
          <img src="/logo-512.jpg" alt="" className="brand-mark" />
          <span className="brand-name">Angvey</span>
          <span className="brand-chip">beta</span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span aria-hidden>{n.emoji}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-right">
          {streak !== null && (
            <span className="pill streak" title="Daily streak">
              🔥 {streak}
            </span>
          )}
          <span className="pill exam-pill">{exam}</span>
          <Link to="/doubt" className="btn btn-primary btn-sm nav-cta">
            Doubt poocho
          </Link>
          <button
            className="icon-btn hamburger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand" style={{ marginBottom: 8 }}>
            <img src="/logo-512.jpg" alt="" className="brand-mark" />
            <span className="brand-name">Angvey</span>
          </div>
          <p className="muted small">
            हर doubt का जवाब, अपनी भाषा में।<br />
            Voice-first AI study saathi for Bharat.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Product</h4>
            <Link to="/doubt">Doubt Saathi</Link>
            <Link to="/practice">Practice Arena</Link>
            <Link to="/planner">Revision Planner</Link>
            <Link to="/dash">My Dash</Link>
          </div>
          <div>
            <h4>Company</h4>
            <a href="https://github.com/lakshay-boora/studania/blob/main/docs/RESEARCH.md" target="_blank" rel="noreferrer">Research</a>
            <a href="https://github.com/lakshay-boora/studania/blob/main/docs/MODELS.md" target="_blank" rel="noreferrer">Open-source stack</a>
            <a href="https://github.com/lakshay-boora/studania/blob/main/docs/BUSINESS.md" target="_blank" rel="noreferrer">Business</a>
            <a href="https://github.com/lakshay-boora/studania" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
          <div>
            <h4>Plans</h4>
            <span className="muted small">Sahaj — free</span>
            <span className="muted small">Sahaj+ — ₹49/mo</span>
            <span className="muted small">Pro — ₹99/mo</span>
            <span className="muted small">Paathshala — B2B</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Angvey Technologies · Sonipat, Haryana</span>
        <span className="muted small">Made in Bharat, for Bharat · Built on open-source models</span>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className={isLanding ? '' : 'app-main'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/doubt" element={<Chat />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/dash" element={<Dash />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
