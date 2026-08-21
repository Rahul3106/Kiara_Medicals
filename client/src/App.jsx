import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import AdminRoutes from './admin/routes/adminRoutes';
import StoreRoutes from './store/routes/storeRoutes';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Isolated Admin Module */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Isolated Store/Branch Module */}
        <Route path="/store/*" element={<StoreRoutes />} />

        {/* Root Redirect to Store Login */}
        <Route path="/" element={<Navigate to="/store/login" replace />} />
        <Route path="*" element={<Navigate to="/store/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
