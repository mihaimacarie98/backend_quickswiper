import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';

const App = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/subscriptions" />;
  }

  return (
    <div>
      <Navbar />
      <h1>Welcome to the Subscription App</h1>
      <p>Please register or login to continue.</p>
    </div>
  );
};

export default App;
