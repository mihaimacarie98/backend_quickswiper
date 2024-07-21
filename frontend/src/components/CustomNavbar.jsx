import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import './Navbar.css'; // Import the custom CSS

const CustomNavbar = () => {
  const { currentUser, logout } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="custom-nav">
      <Container>
        <Navbar.Brand as={Link} to="/">QuickSwiper</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {currentUser ? (
              <>
                <Button variant="outline-light" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
