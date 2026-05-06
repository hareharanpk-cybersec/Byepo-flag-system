import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminLogin } from '../../api/auth';
import Nav from '../../components/Nav';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import Alert from '../../components/Alert';

export default function AdminAuth() {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      loginAdmin(res.data.token);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav role="Org Admin Portal" />
      <div className="center-wrapper">
        <Card style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}><span style={{ color: 'var(--color-highlight)' }}>Admin</span> Login</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Sign in with the credentials provided by your Super Admin.
          </p>

          <Alert type="error" message={error} />

          <form onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '16px' }}>
              <a href="/forgot-password" style={{ fontSize: 13, color: 'var(--color-highlight)', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</a>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              style={{ marginTop: 8 }}
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
