import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Subscriptions = () => {
  const { getSubscriptions, cancelSubscription } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subs = await getSubscriptions();
        setSubscriptions(subs);
      } catch (error) {
        setError('Failed to fetch subscriptions');
      }
    };

    fetchSubscriptions();
  }, [getSubscriptions]);

  const handleCancel = async (subscriptionId) => {
    try {
      await cancelSubscription(subscriptionId);
      setSubscriptions(subs => subs.filter(sub => sub._id !== subscriptionId));
    } catch (error) {
      setError('Failed to cancel subscription');
    }
  };

  return (
    <div className="container">
      <h2>Your Subscriptions</h2>
      {error && <p className="error-message">{error}</p>}
      {subscriptions.length > 0 ? (
        <ul>
          {subscriptions.map((sub) => (
            <li key={sub._id}>
              <p><strong>Price ID:</strong> {sub.priceId}</p>
              <p><strong>Status:</strong> {sub.status}</p>
              <p><strong>Start Date:</strong> {new Date(sub.current_period_start).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {sub.canceled_at_period_end ? 'Ongoing' : new Date(sub.current_period_end).toLocaleDateString()}</p>
              {sub.status !== 'canceled' && (
                <button onClick={() => handleCancel(sub._id)}>Cancel</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No subscriptions found.</p>
      )}
      <Link to="/checkout">Create New Subscription</Link>
    </div>
  );
};

export default Subscriptions;
