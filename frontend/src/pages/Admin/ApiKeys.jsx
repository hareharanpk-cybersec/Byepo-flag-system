import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiKeys, createApiKey, revokeApiKey } from '../../api/apiKeys';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function ApiKeys({ disabled }) {
  const { adminToken } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const res = await getApiKeys(adminToken);
      setKeys(res.data);
    } catch (err) {
      toast.error('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, [adminToken]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('API key name is required.');
      return;
    }
    setCreating(true);

    try {
      const res = await createApiKey(adminToken, name);
      toast.success(`API Key created! Secret: ${res.data.key}`);
      setName('');
      loadKeys();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API Key? Any application using it will lose access immediately.')) return;
    try {
      await revokeApiKey(adminToken, id);
      toast.success('API Key revoked.');
      loadKeys();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke API key.');
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-highlight)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Generate New API Key
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, marginBottom: 0 }}>
            <FormInput
              label="Key Name"
              placeholder="e.g. Production Backend Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: 0 }}
              disabled={disabled}
            />
          </div>
          <Button variant="primary" loading={creating} onClick={handleCreate} style={{ height: 44 }} disabled={disabled}>
            Generate Key
          </Button>
        </div>
      </Card>

      <Card noPadding>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Secret Key</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <tr><td colSpan="4"><Skeleton height="24px" /></td></tr>
                <tr><td colSpan="4"><Skeleton height="24px" /></td></tr>
              </>
            ) : keys.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: 0 }}><EmptyState title="No API Keys" description="Generate your first API key above." /></td></tr>
            ) : (
              keys.map(k => (
                <tr key={k.id}>
                  <td style={{ fontWeight: 600 }}>{k.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-text-muted)' }}>{k.key.substring(0, 12)}...</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(k.key)
                            .then(() => toast.success('API key copied to clipboard!'))
                            .catch(() => toast.error('Failed to copy.'));
                        }}
                        title="Copy full key"
                        style={{
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          fontSize: 13,
                          lineHeight: 1,
                          color: 'var(--color-text-muted)',
                          transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button variant="danger" onClick={() => handleRevoke(k.id)} disabled={disabled}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
