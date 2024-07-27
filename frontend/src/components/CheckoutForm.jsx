import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription, currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await axios.post('/api/payment/fetch-price-details', {
          priceId: import.meta.env.VITE_PRICE_ID1,
        });
        setProductDetails(data);

        const intentData = await axios.post('/api/payment/create-setup-intent', null, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setClientSecret(intentData.data.clientSecret);
        setError(null); // Reset error state if product details are fetched successfully
      } catch (err) {
        setError('Failed to fetch product details');
      }
    };

    fetchProductDetails();
  }, [paymentMethodType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    // Disable the submit button to prevent multiple clicks
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    if (!stripe || !elements || !clientSecret) {
      setError("Stripe has not loaded yet. Please try again.");
      setLoading(false);
      if (submitButton) {
        submitButton.disabled = false;
      }
      return;
    }

    const billingDetails = {
      name: currentUser ? currentUser.name : 'Customer Name',
      email: currentUser ? currentUser.email : 'customer@example.com',
    };

    let paymentMethod;

    if (paymentMethodType === 'card') {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod: cardPaymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: billingDetails,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        if (submitButton) {
          submitButton.disabled = false;
        }
        return;
      }
      paymentMethod = cardPaymentMethod;
    }

    try {
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (result.error) {
        setError(result.error.message);

        const intentData = await axios.post('/api/payment/create-setup-intent', null, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setClientSecret(intentData.data.clientSecret);

        setLoading(false);
        if (submitButton) {
          submitButton.disabled = false;
        }
        return;
      }

      // Create subscription after payment method is set up
      const subscriptionResponse = await createSubscription(paymentMethod.id, import.meta.env.VITE_PRICE_ID1);

      console.log('Subscription created:', subscriptionResponse);
      navigate('/subscriptions');
    } catch (err) {
      setError(err.message);
      setLoading(false);
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
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
                  <Form.Label>Payment Method</Form.Label>
                  <Form.Control as="select" value={paymentMethodType} onChange={(e) => setPaymentMethodType(e.target.value)}>
                    <option value="card">Card</option>
                    {/*<option value="sepa_debit">SEPA Direct Debit</option>*/}
                  </Form.Control>
                </Form.Group>
                {paymentMethodType === 'card' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Card Details</Form.Label>
                    <CardElement className="form-control" />
                  </Form.Group>
                )}
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
