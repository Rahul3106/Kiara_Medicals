import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import StoreLogin from '../pages/StoreLogin';
import StoreDashboard from '../pages/StoreDashboard';
import InventoryList from '../pages/Inventory/InventoryList';
import PurchaseEntry from '../pages/Purchase/PurchaseEntry';
import PurchaseHistory from '../pages/Purchase/PurchaseHistory';
import SupplierList from '../pages/Suppliers/SupplierList';
import NewBill from '../pages/Sales/NewBill';
import BillHistory from '../pages/Sales/BillHistory';
import CustomerList from '../pages/Customers/CustomerList';
import StoreReports from '../pages/Reports/StoreReports';

export const StoreRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/store/dashboard" replace /> : <StoreLogin />}
      />
      <Route
        path="dashboard"
        element={isAuthenticated ? <StoreDashboard /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="sales/new"
        element={isAuthenticated ? <NewBill /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="sales"
        element={isAuthenticated ? <BillHistory /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="inventory"
        element={isAuthenticated ? <InventoryList /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="purchases/new"
        element={isAuthenticated ? <PurchaseEntry /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="purchases"
        element={isAuthenticated ? <PurchaseHistory /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="customers"
        element={isAuthenticated ? <CustomerList /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="suppliers"
        element={isAuthenticated ? <SupplierList /> : <Navigate to="/store/login" replace />}
      />
      <Route
        path="reports"
        element={isAuthenticated ? <StoreReports /> : <Navigate to="/store/login" replace />}
      />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default StoreRoutes;
