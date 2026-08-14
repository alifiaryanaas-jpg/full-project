import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isLoggedIn, type Role } from '../lib/api';

/**
 * Bungkus route yang butuh login. `allow` nentuin role mana aja yang
 * boleh masuk -- misal ['admin'] buat halaman Admin, atau
 * ['admin', 'user'] buat halaman yang staff juga boleh akses.
 */
export default function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  if (!isLoggedIn(allow)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
