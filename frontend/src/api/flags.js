import { authClient } from './client';

export const getFlags = (token) =>
  authClient(token).get('/flags');

export const createFlag = (token, featureKey) =>
  authClient(token).post('/flags', { featureKey });

export const updateFlag = (token, id, data) =>
  authClient(token).patch(`/flags/${id}`, data);

export const deleteFlag = (token, id) =>
  authClient(token).delete(`/flags/${id}`);

export const checkFlag = (token, featureKey, environment) =>
  authClient(token).post('/flags/check', { featureKey, environment });
