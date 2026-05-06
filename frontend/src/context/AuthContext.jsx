import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [superAdminToken, setSuperAdminToken] = useState(() => localStorage.getItem('superAdminToken'));
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));
  const [userToken, setUserToken] = useState(() => localStorage.getItem('userToken'));

  const navigate = useNavigate();

  useEffect(() => {
    // Simulate a brief loading sequence to show the requested loading page
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const loginSuperAdmin = useCallback((token) => {
    localStorage.setItem('superAdminToken', token);
    setSuperAdminToken(token);
  }, []);
  const logoutSuperAdmin = useCallback(() => {
    localStorage.removeItem('superAdminToken');
    setSuperAdminToken(null);
    navigate('/');
  }, [navigate]);

  const loginAdmin = useCallback((token) => {
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
  }, []);
  const logoutAdmin = useCallback(() => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    navigate('/');
  }, [navigate]);

  const loginUser = useCallback((token) => {
    localStorage.setItem('userToken', token);
    setUserToken(token);
  }, []);
  const logoutUser = useCallback(() => {
    localStorage.removeItem('userToken');
    setUserToken(null);
    navigate('/');
  }, [navigate]);

  if (isInitializing) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#000000', fontSize: '24px', fontWeight: 'bold', margin: 0, fontFamily: 'monospace', letterSpacing: '1px' }}>
          Simplifying Complexity | Powering Progress
        </h1>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        superAdminToken, loginSuperAdmin, logoutSuperAdmin,
        adminToken,      loginAdmin,      logoutAdmin,
        userToken,       loginUser,       logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
