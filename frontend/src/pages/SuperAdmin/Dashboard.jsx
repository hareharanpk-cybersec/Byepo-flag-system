import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getOrganizations, createOrganization, scheduleDeletion, getOrganizationDetails, resetAdminPassword } from '../../api/organizations';
import Nav from '../../components/Nav';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function SuperAdminDashboard() {
  const { superAdminToken, logoutSuperAdmin } = useAuth();
  const toast = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [errorOrgs, setErrorOrgs] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  
  // Org & Admin fields
  const [orgName, setOrgName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [creating, setCreating] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  const [deleteModalOrg, setDeleteModalOrg] = useState(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // View Modal State
  const [viewOrgId, setViewOrgId] = useState(null);
  const [viewOrgData, setViewOrgData] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const openViewModal = async (orgId) => {
    setViewOrgId(orgId);
    setLoadingView(true);
    setViewOrgData(null);
    setNewAdminPassword('');
    try {
      const res = await getOrganizationDetails(superAdminToken, orgId);
      setViewOrgData(res.data);
    } catch (err) {
      toast.error('Failed to load organization details.');
      setViewOrgId(null);
    } finally {
      setLoadingView(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newAdminPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setResettingPassword(true);
    try {
      await resetAdminPassword(superAdminToken, viewOrgId, newAdminPassword);
      toast.success('Admin password updated successfully.');
      setNewAdminPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setResettingPassword(false);
    }
  };

  const loadOrgs = async () => {
    try {
      setLoadingOrgs(true);
      const res = await getOrganizations(superAdminToken);
      setOrgs(res.data);
    } catch (err) {
      setErrorOrgs(err.response?.data?.error || 'Failed to load organizations.');
      toast.error(err.response?.data?.error || 'Failed to load organizations.');
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, [superAdminToken]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreatedAdmin(null);

    try {
      const payload = {
        name: orgName,
        adminUsername,
        adminEmail,
        adminPassword,
      };
      const res = await createOrganization(superAdminToken, payload);
      
      toast.success(`Organization "${res.data.org.name}" created successfully.`);
      setCreatedAdmin(res.data.adminUser);
      
      setOrgName('');
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      loadOrgs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create organization.');
    } finally {
      setCreating(false);
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => toast.success('Organization ID copied!')).catch(console.error);
  };

  const totalOrgs = orgs.length;
  const totalUsers = orgs.reduce((sum, org) => sum + (org._count?.users || 0), 0);
  const totalFlags = orgs.reduce((sum, org) => sum + (org._count?.flags || 0), 0);

  return (
    <>
      <Nav loggedIn role="Super Admin" onLogout={logoutSuperAdmin} />
      <div className="page-wrapper">
        <div className="section-header">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard Overview</h1>
          <Button variant="primary" onClick={() => { setShowCreate(!showCreate); setCreatedAdmin(null); }}>
            {showCreate ? 'Cancel' : '+ Create Organization'}
          </Button>
        </div>

        {!loadingOrgs && !errorOrgs && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <Card style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-highlight)', marginBottom: 'var(--space-1)' }}>{totalOrgs}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Organizations</div>
            </Card>
            <Card style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-highlight)', marginBottom: 'var(--space-1)' }}>{totalUsers}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provisioned Users</div>
            </Card>
            <Card style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-highlight)', marginBottom: 'var(--space-1)' }}>{totalFlags}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Feature Flags</div>
            </Card>
          </div>
        )}

        {showCreate && (
          <Card style={{ marginBottom: 'var(--space-4)', background: 'var(--color-surface-2)' }}>
            
            {createdAdmin && (
              <div style={{ background: 'var(--color-success-soft)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid rgba(34,134,58,0.2)' }}>
                <strong style={{ color: 'var(--color-success)', display: 'block', marginBottom: '8px' }}>Success! Share these credentials securely:</strong>
                <div style={{ fontSize: 14, fontFamily: 'monospace' }}>
                  <div><strong>Email:</strong> {createdAdmin.email}</div>
                  <div><strong>Username:</strong> {createdAdmin.username}</div>
                  <div><strong>Role:</strong> ORG_ADMIN</div>
                  <div style={{ marginTop: 4, color: 'var(--color-text-muted)' }}>(Password is known to you)</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <FormInput
                  label="Organization Name"
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
                <FormInput
                  label="Admin Username"
                  placeholder="e.g. admin_acme"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                />
                <FormInput
                  label="Admin Email"
                  type="email"
                  placeholder="admin@acmecorp.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
                <FormInput
                  label="Admin Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" loading={creating}>
                  Create Organization & Admin
                </Button>
              </div>
            </form>
          </Card>
        )}

        {errorOrgs ? (
          <Alert type="error" message={errorOrgs} />
        ) : (
          <Card noPadding>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization ID</th>
                  <th>Users</th>
                  <th>Flags</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrgs ? (
                  <>
                    <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                    <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                    <tr><td colSpan="5"><Skeleton height="24px" /></td></tr>
                  </>
                ) : orgs.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 0 }}><EmptyState title="No organizations found" description="Create an organization to get started." /></td></tr>
                ) : (
                  orgs.map(org => (
                    <tr key={org.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-highlight)' }}>
                        {org.name}
                        {org.status === 'PENDING_DELETION' && (
                          <div style={{ fontSize: 11, color: 'var(--color-error)', marginTop: 4 }}>
                            Pending Deletion
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{ fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', color: 'var(--color-text-muted)' }}
                          onClick={(e) => {
                            copyId(org.id);
                            e.target.innerText = 'Copied!';
                            e.target.style.color = 'var(--color-success)';
                            setTimeout(() => {
                              e.target.innerText = `${org.id.substring(0, 8)}...`;
                              e.target.style.color = 'var(--color-text-muted)';
                            }, 1500);
                          }}
                          title="Click to copy"
                        >
                          {org.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td><span style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{org._count.users}</span></td>
                      <td><span style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{org._count.flags}</span></td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: org.status === 'ACTIVE' ? 'var(--color-success-soft)' : 'var(--color-error-soft)', color: org.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                          {org.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{new Date(org.createdAt).toLocaleDateString()}</td>
                      <td style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="ghost" onClick={() => openViewModal(org.id)} style={{ padding: '4px 12px', fontSize: 13, height: 'auto' }}>
                          View
                        </Button>
                        {org.status === 'ACTIVE' ? (
                          <Button variant="danger" onClick={() => setDeleteModalOrg(org)} style={{ padding: '4px 12px', fontSize: 13, height: 'auto' }}>
                            Delete
                          </Button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', alignSelf: 'center' }}>Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {deleteModalOrg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <Card style={{ width: '100%', maxWidth: 450, background: 'var(--color-surface)' }}>
            <h2 style={{ fontSize: 18, marginBottom: 'var(--space-2)' }}>Delete Organization</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
              This will disable the organization <strong>{deleteModalOrg.name}</strong> immediately and schedule it for permanent deletion in 24 hours.
            </p>
            <div style={{ background: 'var(--color-error-soft)', color: 'var(--color-error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-4)', fontSize: 13, fontWeight: 500 }}>
              To confirm, type the exact name below: <br/>
              <strong style={{ userSelect: 'none', display: 'inline-block', marginTop: 4 }}>{deleteModalOrg.name}</strong>
            </div>
            <FormInput
              placeholder="Type organization name..."
              value={captchaInput}
              onChange={e => setCaptchaInput(e.target.value)}
              style={{ marginBottom: 'var(--space-6)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="ghost" onClick={() => { setDeleteModalOrg(null); setCaptchaInput(''); }}>Cancel</Button>
              <Button 
                variant="danger" 
                disabled={captchaInput !== deleteModalOrg.name} 
                loading={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await scheduleDeletion(superAdminToken, deleteModalOrg.id);
                    toast.success('Organization scheduled for deletion.');
                    setDeleteModalOrg(null);
                    setCaptchaInput('');
                    loadOrgs();
                  } catch(err) {
                    toast.error(err.response?.data?.error || 'Failed to schedule deletion.');
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                Confirm Deletion
              </Button>
            </div>
          </Card>
        </div>
      )}

      {viewOrgId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', overflowY: 'auto' }}>
          <Card style={{ width: '100%', maxWidth: 800, background: 'var(--color-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 24, margin: 0, color: 'var(--color-highlight)' }}>Organization Details</h2>
              <Button variant="ghost" onClick={() => setViewOrgId(null)}>Close</Button>
            </div>

            {loadingView ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading details...</div>
            ) : viewOrgData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', background: 'var(--color-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Name</div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{viewOrgData.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                    <div>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: viewOrgData.status === 'ACTIVE' ? 'var(--color-success-soft)' : 'var(--color-error-soft)', color: viewOrgData.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                        {viewOrgData.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Organization ID</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{viewOrgData.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Created At</div>
                    <div style={{ fontSize: 14 }}>{new Date(viewOrgData.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* Password Reset */}
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 'var(--space-3)', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Admin Access Control</h3>
                  <form onSubmit={handlePasswordReset} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, marginBottom: 0 }}>
                      <FormInput
                        label={`Reset Password for ${viewOrgData.users.find(u => u.role === 'ORG_ADMIN')?.username || 'Admin'}`}
                        placeholder="Enter new password (min 8 chars)"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        required
                        minLength={8}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <Button variant="danger" loading={resettingPassword} type="submit" style={{ height: 44 }}>
                      Change Password
                    </Button>
                  </form>
                </div>

                {/* Members List */}
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 'var(--space-3)', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Members ({viewOrgData.users.length})</h3>
                  <table style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrgData.users.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 500 }}>{u.username}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                          <td>
                            <span style={{ fontSize: 11, background: 'var(--color-accent-soft)', color: 'var(--color-accent)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{u.role}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Flags List */}
                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 'var(--space-3)', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Feature Flags ({viewOrgData.flags.length})</h3>
                  {viewOrgData.flags.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No flags created yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {viewOrgData.flags.map(f => (
                        <span key={f.id} style={{ fontFamily: 'monospace', fontSize: 13, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                          {f.featureKey}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </Card>
        </div>
      )}
    </>
  );
}
