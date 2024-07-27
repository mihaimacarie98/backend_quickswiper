import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomNavbar from './CustomNavbar';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const Register = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await register(emailRef.current.value, passwordRef.current.value, firstNameRef.current.value, lastNameRef.current.value);
    } catch {
      setError(`Failed to create an account`);
    }

    setLoading(false);
  }

  return (
    <div>
      <CustomNavbar />
      <Container className="mt-5">
        <h2 className="text-center mb-4">Register</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group id="firstName" className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control type="text" ref={firstNameRef} required placeholder="First Name" />
          </Form.Group>
          <Form.Group id="lastName" className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control type="text" ref={lastNameRef} required placeholder="Last Name" />
          </Form.Group>
          <Form.Group id="email" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" ref={emailRef} required placeholder="Email" />
          </Form.Group>
          <Form.Group id="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" ref={passwordRef} autoComplete='new-password' required placeholder="Password" />
          </Form.Group>
          <Button disabled={loading} className="w-100" type="submit">
            Register
          </Button>
        </Form>
      </Container>
    </div>
  );
};

export default Register;
