import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/subscriptions');
    }
  }, [currentUser, navigate]);

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {!currentUser && (
        <p>Please <a href="/login">login</a> or <a href="/register">register</a> to manage your subscriptions.</p>
      )}
    </div>
  );
};

export default Home;
