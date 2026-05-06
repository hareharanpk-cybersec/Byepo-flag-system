import { authClient } from './client';

export const getApiKeys = (token) =>
  authClient(token).get('/api-keys');

export const createApiKey = (token, name) =>
  authClient(token).post('/api-keys', { name });

export const revokeApiKey = (token, id) =>
  authClient(token).delete(`/api-keys/${id}`);
