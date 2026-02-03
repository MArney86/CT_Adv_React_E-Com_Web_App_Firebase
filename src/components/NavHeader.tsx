import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import { type User } from 'firebase/auth'
import RegisterButton from './RegisterButton';
import LoginButton from './LoginButton';

type NavHeaderProps = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const NavHeader: React.FC<NavHeaderProps> = ({ user, setUser }) => {

    return (
        <>
            <Navbar bg="light" expand="lg">
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto justify-content-between w-100 px-5">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Navbar.Brand as={Link} to="/">FakeStore</Navbar.Brand>
                        <Nav.Link as={Link} to="/cart">Cart</Nav.Link>
                        {user && <Nav.Link as={Link} to="/products">Products</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/orders">Orders</Nav.Link>}
                        {user && <Nav.Link as={Link} to="/profile">Profile</Nav.Link>}
                        <Nav.Item>
                            <p>{user?.email}</p>
                        </Nav.Item>
                    </Nav>
                    {user ? null :  <RegisterButton user={user} setUser={setUser} />}
                    <LoginButton user={user} setUser={setUser} />
                </Navbar.Collapse>
            </Navbar>
        </>
    )

}

export default NavHeader