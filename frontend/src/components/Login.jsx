import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomNavbar from './CustomNavbar';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      navigate('/'); // Navigate to home or another route on successful login
    } catch {
      setError('Failed to log in');
    }

    setLoading(false);
  }

  return (
    <div>
      <CustomNavbar />
      <Container className="mt-5">
        <h2 className="text-center mb-4">Login</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" ref={emailRef} required placeholder="Email" />
          </Form.Group>
          <Form.Group id="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" ref={passwordRef} required placeholder="Password" />
          </Form.Group>
          <Button disabled={loading} className="w-100" type="submit">
            Login
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default Login;
