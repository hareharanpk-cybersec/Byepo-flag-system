import { authClient } from './client';

export const getAuditLogs = (token) =>
  authClient(token).get('/audit-logs');
