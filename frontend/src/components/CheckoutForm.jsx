import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';

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
                        <td>{productDetails.price / 100} {productDetails.currency.toUpperCase()}</td>
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
