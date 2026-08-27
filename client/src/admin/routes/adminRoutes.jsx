import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import BranchManagement from '../pages/BranchManagement';
import UserManagement from '../pages/UserManagement';
import ConsolidatedInventory from '../pages/ConsolidatedInventory';
import ConsolidatedSales from '../pages/ConsolidatedSales';
import ExpiryOverview from '../pages/ExpiryOverview';
import AuditLogsView from '../pages/AuditLogsView';

export const AdminRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={
          isAuthenticated && isAdmin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <AdminLogin />
          )
        }
      />
      <Route
        path="dashboard"
        element={
          isAuthenticated && isAdmin ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="branches"
        element={
          isAuthenticated && isAdmin ? (
            <BranchManagement />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="users"
        element={
          isAuthenticated && isAdmin ? (
            <UserManagement />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="inventory"
        element={
          isAuthenticated && isAdmin ? (
            <ConsolidatedInventory />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="sales"
        element={
          isAuthenticated && isAdmin ? (
            <ConsolidatedSales />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="expiry"
        element={
          isAuthenticated && isAdmin ? (
            <ExpiryOverview />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route
        path="audit-logs"
        element={
          isAuthenticated && isAdmin ? (
            <AuditLogsView />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
