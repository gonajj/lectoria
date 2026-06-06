import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Upload,
  History,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/templates', icon: Layers,          label: 'Plantillas' },
  { to: '/upload',   icon: Upload,           label: 'Procesar Documento' },
  { to: '/history',  icon: History,          label: 'Historial' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              LectorIA
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              SEDECO · Documentos
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        <div style={{
          padding: '8px 16px 4px',
          fontSize: 11, fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Menú
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>SEDECO</div>
        Secretaría de Desarrollo Económico
      </div>
    </aside>
  );
}
