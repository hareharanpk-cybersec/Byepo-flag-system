import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { checkFlag } from '../../api/flags';
import Nav from '../../components/Nav';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export default function FeatureCheck() {
  const { userToken, logoutUser } = useAuth();
  const toast = useToast();
  const [featureKey, setFeatureKey] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Extract orgName from the JWT token payload
  let orgName = 'your organization';
  if (userToken) {
    try {
      const payload = JSON.parse(atob(userToken.split('.')[1]));
      if (payload.orgName) orgName = payload.orgName;
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  const handleCheck = async () => {
    if (!featureKey.trim()) {
      toast.error('Please enter a feature key.');
      return;
    }
    setChecking(true);
    setResult(null);

    try {
      const res = await checkFlag(userToken, featureKey);
      setResult(res.data);
      
      setHistory(prev => {
        const newHist = [{ key: res.data.featureKey, enabled: res.data.enabled, time: new Date() }, ...prev];
        if (newHist.length > 10) newHist.pop();
        return newHist;
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check failed.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Nav loggedIn role="End User" onLogout={logoutUser} />
      <div className="page-wrapper">
        <h1 className="page-title">Feature Check</h1>

        <Card>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            Enter a feature key to check whether it is enabled for <strong>{orgName}</strong>.
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <FormInput
                label="Feature Key"
                placeholder="e.g. dark_mode, beta-checkout"
                value={featureKey}
                onChange={(e) => setFeatureKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                style={{ marginBottom: 0 }}
              />
            </div>
            <Button variant="primary" loading={checking} onClick={handleCheck} style={{ height: 44 }}>
              Check Feature
            </Button>
          </div>

          {result && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div style={{
                background: result.enabled ? 'var(--color-success-soft)' : 'var(--color-error-soft)',
                border: `1px solid ${result.enabled ? 'rgba(34,134,58,0.25)' : 'rgba(203,36,49,0.25)'}`,
                color: result.enabled ? 'var(--color-success)' : 'var(--color-error)',
                padding: 'var(--space-4) var(--space-6)',
                borderRadius: 'var(--radius-md)',
                fontSize: 15,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, fontWeight: 'bold' }}>{result.enabled ? 'Y' : 'N'}</span>
                <div>
                  Feature <strong style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--color-highlight)' }}>'{result.featureKey}'</strong> is{' '}
                  <strong>{result.enabled ? 'ENABLED' : 'DISABLED'}</strong> for <strong>{orgName}</strong>.
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-highlight)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
            Recent Checks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {history.length === 0 ? (
              <EmptyState title="No checks yet" description="Your recent feature checks will appear here." />
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--color-highlight)' }}>{h.key}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <Badge enabled={h.enabled} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{h.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
