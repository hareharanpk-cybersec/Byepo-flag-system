import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUsers, createUser, deleteUser } from '../../api/users';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Alert from '../../components/Alert';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function ManageUsers({ disabled }) {
  const { adminToken } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getUsers(adminToken);
      setUsers(res.data);
    } catch (err) {
      setErrorUsers(err.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [adminToken]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createUser(adminToken, { username, email, password });
      toast.success(`User "${username}" created successfully.`);
      setUsername('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this end user account? This action cannot be undone.')) return;
    try {
      await deleteUser(adminToken, id);
      toast.success('User deleted successfully.');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
    }
  };

  return (
    <>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-highlight)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Provision New User
        </div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormInput
              label="Username"
              placeholder="e.g. jdoe123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={disabled}
            />
            <FormInput
              label="Email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={disabled}
            />
            <FormInput
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={disabled}
            />
          </div>
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" loading={creating} disabled={disabled}>
              Create End User
            </Button>
          </div>
        </form>
      </Card>

      {errorUsers ? (
        <Alert type="error" message={errorUsers} />
      ) : (
        <Card noPadding>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>User ID</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <>
                  <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                  <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                  <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                </>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: 0 }}><EmptyState title="No end users yet" description="Provision an end user to give them access." /></td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.username || '—'}</td>
                    <td>{u.email}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{u.id.substring(0, 13)}...</span></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button variant="danger" onClick={() => handleDelete(u.id)} disabled={disabled}>
                        Remove Access
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
