import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Label, Button } from '../components/ui';
import { BrandMark } from '../components/Brand';
import { login } from '../lib/api';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const res = await login(password);
      navigate(res.role === 'admin' ? '/admin/employees' : '/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <BrandMark size="lg" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 mt-3">
            IT Asset Tracker
          </p>
        </div>

        <Card className="border-gray-200/80 shadow-md">
          <h2 className="font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-xs text-gray-500 mb-4">Enter your staff or admin password to continue.</p>
          <div className="space-y-3">
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your password"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </Card>

        <p className="text-center text-[11px] text-gray-400 mt-5 tracking-wide">
          ecco — it division
        </p>
      </div>
    </div>
  );
}
