import { useEffect, useState } from 'react';
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
      const response = await cancelSubscription(subscriptionId);
      setSubscriptions(subs => subs.map(sub => sub._id === subscriptionId ? response.subscription : sub));
    } catch (error) {
      setError('Failed to cancel subscription');
    }
  };

  const hasActiveSubscription = subscriptions.some(sub => sub.status === 'active' || sub.status === 'trialing');

  return (
    <div className="container">
      <h2>Your Subscriptions</h2>
      {error && <p className="error-message">{error}</p>}
      {subscriptions.length > 0 ? (
        <ul>
          {subscriptions.map((sub) => (
            <li key={sub._id}>
              <p><strong>Product Name:</strong> {sub.productName}</p>
              <p><strong>Product Description:</strong> {sub.productDescription}</p>
              <p><strong>Price:</strong> {sub.price} {sub.currency.toUpperCase()}</p>
              <p><strong>Status:</strong> {sub.status}</p>
              <p><strong>Start Date:</strong> {new Date(sub.current_period_start * 1000).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(sub.current_period_end * 1000).toLocaleDateString()}</p>
              <p><strong>Auto-Renewal:</strong> {sub.canceled_at_period_end ? 'Off' : 'On'}</p>
              {!sub.canceled_at_period_end && (
                <button onClick={() => handleCancel(sub._id)}>Cancel</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No subscriptions found.</p>
      )}
      {(!hasActiveSubscription || subscriptions.every(sub => sub.canceled_at_period_end)) && <Link to="/checkout">Create New Subscription</Link>}
    </div>
  );
};

export default Subscriptions;
