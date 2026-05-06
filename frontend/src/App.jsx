import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import SuperAdmin from './pages/SuperAdmin';
import Admin from './pages/Admin';
import User from './pages/User';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ApiTester from './pages/ApiTester';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/api-tester" element={<ApiTester />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/user" element={<User />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
