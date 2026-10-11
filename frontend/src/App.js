import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import CreateRecord from './pages/CreateRecord';
import EditRecord   from './pages/EditRecord';
import AdminUsers   from './pages/AdminUsers';
import EntryManager from './pages/EntryManager';
import Layout       from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3"></div>
        <p className="text-gray-400">লোড হচ্ছে...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Toaster position="top-right"
          toastOptions={{ style: { fontFamily:"'Noto Sans Bengali', sans-serif", fontSize:'14px' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateRecord />} />
            <Route path="edit/:id" element={<EditRecord />} />
            <Route path="entries" element={<EntryManager />} />
            <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
