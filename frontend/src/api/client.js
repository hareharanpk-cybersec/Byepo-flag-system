import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Returns an axios instance with the Authorization header set.
 * @param {string} token
 */
export const authClient = (token) =>
  axios.create({
    baseURL: 'http://localhost:4000',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

export default client;
