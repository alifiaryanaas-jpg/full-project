import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScanKeluar from './pages/ScanKeluar';
import Login from './pages/Login';
import AdminEmployees from './pages/AdminEmployees';
import InputBarang from './pages/InputBarang';
import AdminRestock from './pages/AdminRestock';
import Report from './pages/Report';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Login -- satu halaman buat Admin & Staff, role ditentukan backend */}
        <Route path="/login" element={<Login />} />

        {/* Staff-facing: Check Out (admin juga boleh akses) */}
        <Route
          path="/"
          element={
            <ProtectedRoute allow={['admin', 'user']}>
              <Layout>
                <ScanKeluar />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allow={['admin']}>
              <AdminLayout>
                <AdminEmployees />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/items"
          element={
            <ProtectedRoute allow={['admin']}>
              <AdminLayout>
                <InputBarang />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/restock"
          element={
            <ProtectedRoute allow={['admin']}>
              <AdminLayout>
                <AdminRestock />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/report"
          element={
            <ProtectedRoute allow={['admin']}>
              <AdminLayout>
                <Report />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}
