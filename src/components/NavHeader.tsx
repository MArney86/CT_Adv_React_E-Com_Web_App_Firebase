import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

const NavHeader: React.FC = () => {

    return (
        <>
            <Navbar bg="light" expand="lg">
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto justify-content-between w-100 px-5">
                        <Nav.Link href="/">Home</Nav.Link>
                        <Navbar.Brand href="#home">FakeStore</Navbar.Brand>
                        <Nav.Link href="/cart">Cart</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </>
    )

}

export default NavHeader