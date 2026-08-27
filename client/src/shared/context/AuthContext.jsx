import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('km_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeBranch, setActiveBranch] = useState(() => {
    const saved = localStorage.getItem('km_branch');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify and hydrate session from HttpOnly Cookie on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get('/api/auth/me', { withCredentials: true });
        if (res.data?.success && res.data.data?.user) {
          const userData = res.data.data.user;
          setUser(userData);
          localStorage.setItem('km_user', JSON.stringify(userData));
          if (!activeBranch && userData.branch) {
            setActiveBranch(userData.branch);
            localStorage.setItem('km_branch', JSON.stringify(userData.branch));
          }
        }
      } catch (err) {
        // Not authenticated or cookie expired - clean up user state
        setUser(null);
        localStorage.removeItem('km_user');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = (userData, branchData = null) => {
    setUser(userData);
    const branch = branchData || userData.branch;
    setActiveBranch(branch);
    localStorage.setItem('km_user', JSON.stringify(userData));
    if (branch) {
      localStorage.setItem('km_branch', JSON.stringify(branch));
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setActiveBranch(null);
      localStorage.removeItem('km_user');
      localStorage.removeItem('km_branch');
      // Also clean up any legacy token if present
      localStorage.removeItem('km_token');
    }
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
        activeBranch,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'SUPER_ADMIN',
        loading,
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
