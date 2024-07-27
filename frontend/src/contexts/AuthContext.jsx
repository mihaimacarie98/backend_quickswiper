import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  
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

  const register = async (email, password, firstName, lastName) => {
    try {
      const response = await axios.post('/api/user/register', { email, password, firstName, lastName });
      const { token } = response.data;
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
      localStorage.setItem('token', token);
      navigate('/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : error.message);
      throw new Error('Registration failed');
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/user/login', { email, password });
      const { token } = response.data;
      const decoded = jwtDecode(token);
      setCurrentUser(decoded);
      localStorage.setItem('token', token);
      navigate('/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const createSubscription = async (paymentMethodId, priceId) => {
    try {
      const response = await axios.post('/api/subscription/create', { paymentMethodId, priceId }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error.response ? error.response.data : error.message);
      throw new Error('Subscription creation failed');
    }
  };

  const createPaymentIntent = async (priceId, paymentMethodType) => {
    try {
      const response = await axios.post('/api/payment/create-payment-intent', { priceId, paymentMethodType }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      return response.data;
    } catch (error) {
      console.error('Payment intent creation failed:', error.response ? error.response.data : error.message);
      throw new Error('Payment intent creation failed');
    }
  }

  const getSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscription/subscriptions', {
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
      const response = await axios.post('/api/subscription/cancel', { subscriptionId }, {
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
    createPaymentIntent
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
