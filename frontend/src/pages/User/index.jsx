import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import FeatureCheck from './FeatureCheck';

export default function User() {
  const { userToken } = useAuth();
  return userToken ? <FeatureCheck /> : <Login />;
}
