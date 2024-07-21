import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import CustomNavbar from './CustomNavbar';
import { Container, Row, Col } from 'react-bootstrap';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  return (
    <>
      <CustomNavbar />
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md={6}>
            <h2 className="text-center mb-4">Checkout</h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Checkout;
