import { authClient } from './client';

export const getUsers = (token) =>
  authClient(token).get('/users');

export const createUser = (token, payload) =>
  authClient(token).post('/users', payload);

export const deleteUser = (token, id) =>
  authClient(token).delete(`/users/${id}`);
