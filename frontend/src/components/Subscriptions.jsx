import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import CustomNavbar from './CustomNavbar';
import { Container, Row, Col, Button, Alert, Card, Table } from 'react-bootstrap';

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
    <>
      <CustomNavbar />
      <Container className="mt-5">
        <h2 className="text-center mb-4">Your Subscriptions</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {subscriptions.length > 0 ? (
          <Row>
            {subscriptions.map((sub) => (
              <Col key={sub._id} md={6} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title className="mb-3">{sub.productName}</Card.Title>
                    <Table striped bordered hover size="sm">
                      <tbody>
                        <tr>
                          <td><strong>Product Description:</strong></td>
                          <td>{sub.productDescription}</td>
                        </tr>
                        <tr>
                          <td><strong>Price:</strong></td>
                          <td>{sub.price} {sub.currency.toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>{sub.status}</td>
                        </tr>
                        <tr>
                          <td><strong>Start Date:</strong></td>
                          <td>{new Date(sub.current_period_start * 1000).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td><strong>End Date:</strong></td>
                          <td>{new Date(sub.current_period_end * 1000).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td><strong>Auto-Renewal:</strong></td>
                          <td>{sub.canceled_at_period_end ? 'Off' : 'On'}</td>
                        </tr>
                      </tbody>
                    </Table>
                    {!sub.canceled_at_period_end && (
                      <div className="text-end">
                        <Button variant="danger" onClick={() => handleCancel(sub._id)}>Cancel</Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p>No subscriptions found.</p>
        )}
        {(!hasActiveSubscription || subscriptions.every(sub => sub.canceled_at_period_end)) && (
          <div className="text-center mt-4">
            <Button as={Link} to="/checkout" variant="primary">Create New Subscription</Button>
          </div>
        )}
      </Container>
    </>
  );
};

export default Subscriptions;
