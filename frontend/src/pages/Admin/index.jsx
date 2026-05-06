import { useAuth } from '../../context/AuthContext';
import Auth from './Auth';
import Dashboard from './Dashboard';

export default function Admin() {
  const { adminToken } = useAuth();
  return adminToken ? <Dashboard /> : <Auth />;
}
