import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { superAdminLogin } from '../../api/auth';
import Nav from '../../components/Nav';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import Alert from '../../components/Alert';

export default function SuperAdminLogin() {
  const { loginSuperAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await superAdminLogin(email, password);
      loginSuperAdmin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav role="Super Admin Portal" />
      <div className="center-wrapper">
        <Card style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}><span style={{ color: 'var(--color-highlight)' }}>Super Admin</span> Login</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Access the global organization management panel.
          </p>

          <Alert type="error" message={error} />

          <form onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              type="email"
              placeholder="superadmin@byepo.com"
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
