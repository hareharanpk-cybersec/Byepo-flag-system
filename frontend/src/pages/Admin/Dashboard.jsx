import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getFlags, createFlag, updateFlag, deleteFlag } from '../../api/flags';
import { getMyOrganization, exportOrganizationData } from '../../api/organizations';
import Nav from '../../components/Nav';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ManageUsers from './ManageUsers';
import ApiKeys from './ApiKeys';
import AuditLogs from './AuditLogs';

export default function AdminDashboard() {
  const { adminToken, logoutAdmin } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('flags'); // 'flags' | 'users' | 'apikeys' | 'audit'
  
  const [flags, setFlags] = useState([]);
  const [loadingFlags, setLoadingFlags] = useState(true);

  const [org, setOrg] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [featureKey, setFeatureKey] = useState('');
  const [creating, setCreating] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!org || org.status !== 'PENDING_DELETION') return;

    const calculateTimeRemaining = () => {
      const deletionTime = new Date(org.deletionScheduledAt).getTime();
      const now = new Date().getTime();
      const difference = deletionTime - now;

      if (difference <= 0) {
        setTimeRemaining('0h 0m 0s');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [org]);

  const loadFlags = async () => {
    try {
      setLoadingFlags(true);
      const res = await getFlags(adminToken);
      setFlags(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load flags.');
    } finally {
      setLoadingFlags(false);
    }
  };

  useEffect(() => {
    if (tab === 'flags') loadFlags();
  }, [adminToken, tab]);

  useEffect(() => {
    getMyOrganization(adminToken).then(res => setOrg(res.data)).catch(console.error);
  }, [adminToken]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportOrganizationData(adminToken);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `byepo-export-${org.name.replace(/\s+/g, '-').toLowerCase()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const isPendingDeletion = org?.status === 'PENDING_DELETION';

  const handleCreate = async () => {
    if (!featureKey.trim()) {
      toast.error('Feature key is required.');
      return;
    }
    setCreating(true);

    try {
      const res = await createFlag(adminToken, featureKey);
      toast.success(`Flag "${res.data.featureKey}" created.`);
      setFeatureKey('');
      loadFlags();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create flag.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateFlag(adminToken, id, data);
      toast.success('Flag updated successfully.');
      loadFlags();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feature flag? This action cannot be undone.')) return;
    try {
      await deleteFlag(adminToken, id);
      toast.success('Flag deleted successfully.');
      loadFlags();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed.');
    }
  };

  const TabButton = ({ name, label }) => (
    <button
      onClick={() => setTab(name)}
      style={{
        padding: '12px 24px', background: 'none', border: 'none',
        borderBottom: tab === name ? '2px solid var(--color-highlight)' : '2px solid transparent',
        color: tab === name ? 'var(--color-highlight)' : 'var(--color-text-muted)',
        fontWeight: 600, fontSize: 15, marginBottom: -1, cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <Nav loggedIn role="Org Admin" onLogout={logoutAdmin} />
      <div className="page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Organization Dashboard</h1>
        </div>

        {isPendingDeletion && (
          <div style={{ background: 'var(--color-error-soft)', border: '1px solid rgba(203, 36, 49, 0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ color: 'var(--color-error)', margin: '0 0 8px 0', fontSize: 16 }}>Organization Scheduled for Deletion</h3>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text)' }}>
                Your organization has been disabled and is scheduled for permanent deletion on <strong>{new Date(org.deletionScheduledAt).toLocaleString()}</strong>. You can no longer make modifications. Please export your data immediately.
              </p>
              <div style={{ marginTop: 'var(--space-3)', display: 'inline-block', background: 'rgba(203, 36, 49, 0.15)', padding: '4px 12px', borderRadius: 999, fontWeight: 700, color: 'var(--color-error)' }}>
                Time Remaining: {timeRemaining}
              </div>
            </div>
            <Button variant="danger" loading={exporting} onClick={handleExport} style={{ flexShrink: 0, marginLeft: 'var(--space-4)' }}>
              Download Export Data
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)', overflowX: 'auto' }}>
          <TabButton name="flags" label="Feature Flags" />
          <TabButton name="users" label="Manage Users" />
          <TabButton name="apikeys" label="API Keys" />
          <TabButton name="audit" label="Audit Logs" />
        </div>

        {tab === 'flags' && (
          <>
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-highlight)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Feature Flag
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, marginBottom: 0 }}>
                  <FormInput
                    label="Feature Key"
                    placeholder="e.g. dark_mode, beta-checkout"
                    value={featureKey}
                    onChange={(e) => setFeatureKey(e.target.value)}
                    style={{ marginBottom: 0 }}
                    disabled={isPendingDeletion}
                  />
                </div>
                <Button variant="primary" loading={creating} onClick={handleCreate} style={{ height: 44 }} disabled={isPendingDeletion}>
                  Create Flag
                </Button>
              </div>
            </Card>

            <Card noPadding>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Feature Key</th>
                      <th style={{ textAlign: 'center' }}>Dev</th>
                      <th style={{ textAlign: 'center' }}>Staging</th>
                      <th style={{ textAlign: 'center' }}>Prod</th>
                      <th style={{ width: 140 }}>Rollout %</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingFlags ? (
                      <>
                        <tr><td colSpan="6"><Skeleton height="24px" /></td></tr>
                        <tr><td colSpan="6"><Skeleton height="24px" /></td></tr>
                        <tr><td colSpan="6"><Skeleton height="24px" /></td></tr>
                      </>
                    ) : flags.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: 0 }}><EmptyState title="No flags yet" description="Create your first feature flag above." /></td></tr>
                    ) : (
                      flags.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13, color: 'var(--color-highlight)' }}>{f.featureKey}</td>
                          <td style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleUpdate(f.id, { isDev: !f.isDev })}>
                            <Badge enabled={f.isDev} />
                          </td>
                          <td style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleUpdate(f.id, { isStaging: !f.isStaging })}>
                            <Badge enabled={f.isStaging} />
                          </td>
                          <td style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleUpdate(f.id, { isProd: !f.isProd })}>
                            <Badge enabled={f.isProd} />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" max="100" 
                              value={f.rolloutPercentage}
                              disabled={isPendingDeletion}
                              onBlur={(e) => handleUpdate(f.id, { rolloutPercentage: parseInt(e.target.value, 10) || 0 })}
                              onChange={(e) => {
                                // Local state update would be better, but onBlur works for simplicity
                                const val = parseInt(e.target.value, 10);
                                if (val >= 0 && val <= 100) {
                                  setFlags(flags.map(flag => flag.id === f.id ? {...flag, rolloutPercentage: val} : flag));
                                }
                              }}
                              style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: 13 }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>%</span>
                          </td>
                          <td>
                            <Button variant="danger" onClick={() => handleDelete(f.id)} disabled={isPendingDeletion}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
        
        {tab === 'users' && <ManageUsers disabled={isPendingDeletion} />}
        {tab === 'apikeys' && <ApiKeys disabled={isPendingDeletion} />}
        {tab === 'audit' && <AuditLogs />}
        
      </div>
    </>
  );
}
