import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import LandingHub from './shared/pages/LandingHub';
import AdminRoutes from './admin/routes/adminRoutes';
import StoreRoutes from './store/routes/storeRoutes';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Main Landing & Portal Selection */}
        <Route path="/" element={<LandingHub />} />

        {/* Isolated Admin Module */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Isolated Store/Branch Module */}
        <Route path="/store/*" element={<StoreRoutes />} />

        {/* Catch-all fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
