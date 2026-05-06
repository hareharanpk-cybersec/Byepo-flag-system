import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { forgotPassword } from '../api/auth';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Nav from '../components/Nav';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      toast.success('If that email exists, a reset link has been sent (Check server logs).');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrapper" style={{ maxWidth: 400, marginTop: '10vh' }}>
        <Card>
          <h1 className="page-title" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}><span style={{ color: 'var(--color-highlight)' }}>Reset</span> Password</h1>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Enter your email to receive a password reset link.
          </p>

          <form onSubmit={handleSubmit}>
            <FormInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
            
            <Button variant="primary" type="submit" loading={loading} fullWidth style={{ marginTop: 'var(--space-4)' }}>
              Send Reset Link
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
