import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('km_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('km_token') || null);
  const [activeBranch, setActiveBranch] = useState(() => {
    const saved = localStorage.getItem('km_branch');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData, authToken, branchData = null) => {
    setUser(userData);
    setToken(authToken);
    setActiveBranch(branchData || userData.branch);
    localStorage.setItem('km_user', JSON.stringify(userData));
    localStorage.setItem('km_token', authToken);
    if (branchData || userData.branch) {
      localStorage.setItem('km_branch', JSON.stringify(branchData || userData.branch));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveBranch(null);
    localStorage.removeItem('km_user');
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_branch');
  };

  const switchBranch = (branch) => {
    if (user?.role === 'SUPER_ADMIN') {
      setActiveBranch(branch);
      localStorage.setItem('km_branch', JSON.stringify(branch));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBranch,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'SUPER_ADMIN',
        login,
        logout,
        switchBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
