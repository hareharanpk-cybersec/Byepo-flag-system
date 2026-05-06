import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { resetPassword } from '../api/auth';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Nav from '../components/Nav';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      await resetPassword(token, password);
      toast.success('Password reset successfully. You can now log in.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrapper" style={{ maxWidth: 400, marginTop: '10vh' }}>
        <Card>
          <h1 className="page-title" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>Create <span style={{ color: 'var(--color-highlight)' }}>New Password</span></h1>

          <form onSubmit={handleSubmit}>
            <FormInput
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <FormInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            
            <Button variant="primary" type="submit" loading={loading} fullWidth style={{ marginTop: 'var(--space-4)' }}>
              Reset Password
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 13 }}>
            <Link to="/" style={{ color: 'var(--color-highlight)', textDecoration: 'none', fontWeight: 600 }}>
              &larr; Back to Login
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
