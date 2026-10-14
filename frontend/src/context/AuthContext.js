import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import axios from 'axios';

// Render Backend API URL
axios.defaults.baseURL = 'https://ntmc-transit-system.onrender.com';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', {
      username,
      password
    });

    const { token: t, user: u } = res.data;

    localStorage.setItem('token', t);

    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;

    setToken(t);
    setUser(u);

    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');

    delete axios.defaults.headers.common['Authorization'];

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAdmin: user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
