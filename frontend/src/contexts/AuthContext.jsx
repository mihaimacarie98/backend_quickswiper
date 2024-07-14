import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correct import
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (e) {
        console.error('Invalid token:', e);
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    }
  }, []);

  const register = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', { email, password });
      const { token } = response.data;
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
      localStorage.setItem('token', token); // Store token in localStorage
      navigate('/subscriptions'); // Redirect to subscriptions page after registration
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : error.message);
      throw new Error('Registration failed');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { email, password });
      const { token } = response.data;
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
      localStorage.setItem('token', token); // Store token in localStorage
      navigate('/subscriptions'); // Redirect to subscriptions page after login
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token'); // Remove token from localStorage
    navigate('/login'); // Redirect to login page after logout
  };

  const createSubscription = async (paymentMethodId, priceId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/subscription/create', { paymentMethodId, priceId }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error.response ? error.response.data : error.message);
      throw new Error('Subscription creation failed');
    }
  };

  const getSubscriptions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subscription/subscriptions', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return response.data;
    } catch (error) {
      console.error('Fetching subscriptions failed:', error.response ? error.response.data : error.message);
      throw new Error('Fetching subscriptions failed');
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/subscription/cancel', { subscriptionId }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return response.data;
    } catch (error) {
      console.error('Cancellation failed:', error.response ? error.response.data : error.message);
      throw new Error('Cancellation failed');
    }
  };

  const value = {
    currentUser,
    register,
    login,
    logout,
    createSubscription,
    getSubscriptions,
    cancelSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
