import { authClient } from './client';

export const getOrganizations = (token) =>
  authClient(token).get('/organizations');

export const createOrganization = (token, data) => 
  authClient(token).post('/organizations', data);

export const scheduleDeletion = (token, orgId) =>
  authClient(token).post(`/organizations/${orgId}/schedule-deletion`);

export const getMyOrganization = (token) =>
  authClient(token).get('/organizations/me');

export const exportOrganizationData = (token) =>
  authClient(token).get('/organizations/export', { responseType: 'blob' });

export const getOrganizationDetails = (token, orgId) =>
  authClient(token).get(`/organizations/${orgId}/details`);

export const resetAdminPassword = (token, orgId, newPassword) =>
  authClient(token).patch(`/organizations/${orgId}/admin-password`, { newPassword });
