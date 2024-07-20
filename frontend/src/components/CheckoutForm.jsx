import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await axios.get('https://quickswiper.com/api/product/price_1PcU5BRsW7phZaeKG6AlIvrp');
        setProductDetails(data);
      } catch (err) {
        setError('Failed to fetch product details');
      }
    };

    fetchProductDetails();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error: submitError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    try {
      const subscription = await createSubscription(paymentMethod.id, 'price_1PcU5BRsW7phZaeKG6AlIvrp');
      console.log('Subscription created:', subscription);
      // Redirect to the subscriptions page after successful payment
      navigate('/subscriptions');
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      {productDetails ? (
        <div>
          <h3>Product Details</h3>
          <p><strong>Name:</strong> {productDetails.name}</p>
          <p><strong>Description:</strong> {productDetails.description}</p>
          <p><strong>Price:</strong> {productDetails.price / 100} {productDetails.currency.toUpperCase()}</p>
        </div>
      ) : (
        <p>Loading product details...</p>
      )}
      <form onSubmit={handleSubmit}>
        <CardElement />
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={!stripe || loading}>
          {loading ? 'Processing...' : 'Subscribe'}
        </button>
      </form>
    </div>
  );
};

export default CheckoutForm;
