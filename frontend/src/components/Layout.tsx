import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../lib/api';
import { BrandHeader } from './Brand';

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary px-5 py-4 flex items-center justify-between border-b-2 border-accent/80">
        <BrandHeader tone="light" title="IT Asset Tracker" subtitle="Check Out" />
        <button onClick={handleLogout} className="text-white/60 hover:text-white flex items-center gap-1 text-xs font-medium transition-colors" title="Logout">
          <LogOut size={18} />
        </button>
      </header>

      <main className="p-4 max-w-3xl mx-auto">{children}</main>
    </div>
  );
}
