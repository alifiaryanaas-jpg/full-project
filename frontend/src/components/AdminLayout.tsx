import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Users, PackagePlus, PackageCheck, BarChart3, LogOut } from 'lucide-react';
import { logout } from '../lib/api';
import { BrandHeader } from './Brand';

const TABS = [
  { to: '/admin/employees', label: 'Employees', icon: Users },
  { to: '/admin/items', label: 'Add Item', icon: PackagePlus },
  { to: '/admin/restock', label: 'Restock', icon: PackageCheck },
  { to: '/admin/report', label: 'Report', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary-dark px-5 py-4 flex items-center justify-between border-b-2 border-accent/80">
        <BrandHeader tone="light" title="Admin Panel" subtitle="IT Asset Tracker" />
        <button onClick={handleLogout} className="text-white/70 hover:text-white flex items-center gap-1 text-xs font-medium transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <nav className="bg-white border-b border-gray-200 flex px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active ? 'border-accent text-ink' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </Link>
          );
        })}
      </nav>

      <main className="p-4 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
