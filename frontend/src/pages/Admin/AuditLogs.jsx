import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getAuditLogs } from '../../api/audit';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AuditLogs() {
  const { adminToken } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const res = await getAuditLogs(adminToken);
        setLogs(res.data);
      } catch (err) {
        toast.error('Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [adminToken, toast]);

  return (
    <Card noPadding>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              <tr><td colSpan="4"><Skeleton height="24px" /></td></tr>
              <tr><td colSpan="4"><Skeleton height="24px" /></td></tr>
            </>
          ) : logs.length === 0 ? (
            <tr><td colSpan="4" style={{ padding: 0 }}><EmptyState title="No Activity" description="Audit logs will appear here as actions are performed." /></td></tr>
          ) : (
            logs.map(log => (
              <tr key={log.id}>
                <td style={{ color: 'var(--color-text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, background: 'var(--color-highlight-soft)', color: 'var(--color-highlight)', padding: '2px 6px', borderRadius: 4 }}>{log.action}</span></td>
                <td>{log.actor}</td>
                <td style={{ fontWeight: 600 }}>{log.target}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
