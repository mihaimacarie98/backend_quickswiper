import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription, createPaymentIntent, currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await axios.post('/api/payment/fetch-price-details', {
          priceId: 'price_1Pf4QIRsW7phZaeKt1ayIe1Q',
        });
        setProductDetails(data);

        const paymentIntentData = await createPaymentIntent('price_1Pf4QIRsW7phZaeKt1ayIe1Q');
        setClientSecret(paymentIntentData.clientSecret);
      } catch (err) {
        setError('Failed to fetch product details');
      }
    };

    fetchProductDetails();
  }, [createPaymentIntent]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements || !clientSecret) {
      setError("Stripe has not loaded yet. Please try again.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: confirmError, paymentIntent, paymentMethod } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: currentUser.name, // Use the current user's name
          },
        },
      });

      if (confirmError) {
        setError(confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const subscriptionResponse = await createSubscription(paymentMethod.id, 'price_1Pf4QIRsW7phZaeKt1ayIe1Q');

        console.log('Subscription created:', subscriptionResponse);
        navigate('/subscriptions');
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h2 className="text-center mb-4">Checkout</h2>
              {productDetails ? (
                <>
                  <Card.Title className="text-center mb-3">Product Details</Card.Title>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td><strong>Name:</strong></td>
                        <td>{productDetails.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{productDetails.description}</td>
                      </tr>
                      <tr>
                        <td><strong>Price:</strong></td>
                        <td>{(productDetails.price / 100).toFixed(2)} {productDetails.currency.toUpperCase()}</td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              ) : (
                <p>Loading product details...</p>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Card Details</Form.Label>
                  <CardElement className="form-control" />
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}
                <Button type="submit" disabled={!stripe || loading} className="w-100">
                  {loading ? 'Processing...' : 'Subscribe'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutForm;
