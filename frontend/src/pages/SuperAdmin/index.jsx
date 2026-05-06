import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';

export default function SuperAdmin() {
  const { superAdminToken } = useAuth();
  return superAdminToken ? <Dashboard /> : <Login />;
}
