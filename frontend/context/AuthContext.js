import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext: Token from localStorage:', token);
    if (token) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log('AuthContext: User fetched from /api/me:', res.data);
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('AuthContext: Error fetching user:', err.message);
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        });
    } else {
      console.log('AuthContext: No token found');
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, { username, password });
      console.log('AuthContext: Login successful, token:', res.data.token);
      localStorage.setItem('token', res.data.token);
      const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      console.log('AuthContext: User set:', userRes.data);
      setUser(userRes.data);
      return true;
    } catch (error) {
      console.error('AuthContext: Login error:', error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, { username, password });
      console.log('AuthContext: Registration successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Registration error:', error.message);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}