import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import CustomNavbar from './components/CustomNavbar';

const App = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/subscriptions" />;
  }

  return (
    <div>
      <CustomNavbar />
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <h1>Welcome to the QuickSwiper Client Area</h1>
            <p>Please register or login to continue.</p>
            <Button variant="primary" href="/register" className="me-2">
              Register
            </Button>
            <Button variant="secondary" href="/login">
              Login
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;