import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const token = localStorage.getItem('token');

  return currentUser || token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
