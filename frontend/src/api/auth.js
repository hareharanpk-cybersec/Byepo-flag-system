import client from './client';

export const superAdminLogin = (email, password) =>
  client.post('/auth/super-admin/login', { email, password });

export const adminLogin = (email, password) =>
  client.post('/auth/admin/login', { email, password });

export const userLogin = (email, password) =>
  client.post('/auth/user/login', { email, password });

export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  client.post('/auth/reset-password', { token, password });
