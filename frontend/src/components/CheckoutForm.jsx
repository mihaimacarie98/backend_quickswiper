import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements, IbanElement, IdealBankElement } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription, createPaymentIntent, currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isSetupIntent, setIsSetupIntent] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState('card');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data } = await axios.post('/api/payment/fetch-price-details', {
          priceId: import.meta.env.VITE_PRICE_ID1,
        });
        setProductDetails(data);

        let intentData;
        if (paymentMethodType === 'sepa_debit') {
          intentData = await axios.post('/api/payment/create-setup-intent', null, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          setIsSetupIntent(true);
        } else {
          intentData = await createPaymentIntent(import.meta.env.VITE_PRICE_ID1, paymentMethodType);
          setIsSetupIntent(false);
        }

        setClientSecret(intentData.clientSecret);
        setError(null); // Reset error state if product details are fetched successfully
      } catch (err) {
        setError('Failed to fetch product details');
      }
    };

    fetchProductDetails();
  }, [createPaymentIntent, paymentMethodType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements || !clientSecret) {
      setError("Stripe has not loaded yet. Please try again.");
      setLoading(false);
      return;
    }

    const billingDetails = {
      name: currentUser ? currentUser.name : 'Customer Name',
      email: currentUser ? currentUser.email : 'customer@example.com',
    };

    const idealElement = elements.getElement(IdealBankElement);

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
        return;
      }
      paymentMethod = cardPaymentMethod;
    } else if (paymentMethodType === 'sepa_debit') {
      const ibanElement = elements.getElement(IbanElement);
      const { error, paymentMethod: sepaPaymentMethod } = await stripe.createPaymentMethod({
        type: 'sepa_debit',
        sepa_debit: ibanElement,
        billing_details: billingDetails,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      paymentMethod = sepaPaymentMethod;
    } else if (paymentMethodType === 'ideal') {
      const { error, paymentMethod: idealPaymentMethod } = await stripe.createPaymentMethod({
        type: 'ideal',
        ideal: idealElement,
        billing_details: billingDetails,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      paymentMethod = idealPaymentMethod;
    }else if (paymentMethodType === 'googlePay') {
        const { error, paymentMethod: googlePayPaymentMethod } = await stripe.createPaymentMethod({
          type: 'googlePay',
          billing_details: billingDetails,
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        paymentMethod = googlePayPaymentMethod;
    } else if (['paypal', 'mobilepay'].includes(paymentMethodType)) {
      const { error, paymentMethod: otherPaymentMethod } = await stripe.createPaymentMethod({
        type: paymentMethodType,
        billing_details: billingDetails,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      paymentMethod = otherPaymentMethod;
    }

    try {
      let result;
      if (isSetupIntent) {
        result = await stripe.confirmCardSetup(clientSecret, {
          payment_method: paymentMethod.id,
        });
      } else {
        if (paymentMethodType === 'card') {
          result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethod.id,
          });
        } else if (paymentMethodType === 'paypal') {
          const paymentIntentId = clientSecret.split('_secret_')[0];
          result = await stripe.confirmPaypalPayment(clientSecret, {
            payment_method: paymentMethod.id,
            return_url: `${import.meta.env.VITE_BACKEND_URL}/api/subscription/confirm-ideal-payment?payment_intent_id=${paymentIntentId}&priceId=${import.meta.env.VITE_PRICE_ID1}`,
          });
        }  else if (paymentMethodType === 'googlePay') {
          const paymentIntentId = clientSecret.split('_secret_')[0];
          result = await stripe.confirmGooglePayPayment(clientSecret, {
            payment_method: paymentMethod.id,
            return_url: `${import.meta.env.VITE_BACKEND_URL}/api/subscription/confirm-ideal-payment?payment_intent_id=${paymentIntentId}&priceId=${import.meta.env.VITE_PRICE_ID1}`,
          });
        }
      }

      if (result.error) {
        setError(result.error.message);

        // Refresh the payment intent if the payment fails
        if (!isSetupIntent) {
          const intentData = await createPaymentIntent(import.meta.env.VITE_PRICE_ID1, paymentMethodType);
          setClientSecret(intentData.clientSecret);
        }

        setLoading(false);
        return;
      }

      // Create subscription after payment is confirmed
      const subscriptionResponse = await createSubscription(paymentMethod.id, import.meta.env.VITE_PRICE_ID1);

      console.log('Subscription created:', subscriptionResponse);
      navigate('/subscriptions');
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
                {paymentMethodType === 'sepa_debit' && (
                  <Form.Group className="mb-3">
                    <Form.Label>IBAN</Form.Label>
                    <IbanElement className="form-control" options={{ supportedCountries: ['SEPA'] }} />
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
