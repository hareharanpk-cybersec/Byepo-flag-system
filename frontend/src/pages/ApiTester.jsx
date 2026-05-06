import { useState } from 'react';
import Nav from '../components/Nav';
import Card from '../components/Card';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { useToast } from '../context/ToastContext';

export default function ApiTester() {
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('');
  const [environment, setEnvironment] = useState('prod');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleTest = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('API Key is required');
      return;
    }
    setLoading(true);
    setResponse(null);

    try {
      const url = new URL('http://localhost:4000/sdk/v1/flags');
      if (userId) url.searchParams.append('userId', userId);
      if (environment) url.searchParams.append('environment', environment);

      const res = await fetch(url.toString(), {
        headers: { 'x-api-key': apiKey }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      setResponse(data);
      toast.success('Successfully fetched flags!');
    } catch (err) {
      toast.error(err.message);
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <div className="page-wrapper" style={{ maxWidth: 800 }}>
        <h1 className="page-title">Developer API Tester</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
          Simulate a backend server or mobile app fetching feature flags from the SDK endpoint.
        </p>

        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <form onSubmit={handleTest}>
            <FormInput
              label="Secret API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="byepo_..."
              required
            />
            
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <FormInput
                  label="Target User ID (Optional for Rollouts)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user-12345"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 13, fontWeight: 600 }}>Environment</label>
                <select 
                  value={environment} 
                  onChange={(e) => setEnvironment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                >
                  <option value="dev">Development</option>
                  <option value="staging">Staging</option>
                  <option value="prod">Production</option>
                </select>
              </div>
            </div>

            <Button variant="primary" type="submit" loading={loading} style={{ marginTop: 'var(--space-2)' }}>
              Fetch Flags
            </Button>
          </form>
        </Card>

        {response && (
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 'var(--space-4)' }}>JSON Response</div>
            <pre style={{ 
              background: 'var(--color-surface-2)', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              fontSize: 13,
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </>
  );
}
