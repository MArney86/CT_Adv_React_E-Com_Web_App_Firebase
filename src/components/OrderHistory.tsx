import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import type { RootState } from '../redux/store/store';
import type { Cart } from '../interfaces/Cart';
import type { CartItem } from '../interfaces/CartItem';
import { auth } from './FirebaseConfig';

const OrderHistory = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const allOrders = useSelector((state: RootState) => state.orders.userOrders);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [selectedOrder, setSelectedOrder] = useState<Cart | null>(null);
    const [showOrderModal, setShowOrderModal] = useState<boolean>(false);

    // Check Firebase auth state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user && !currentUser) {
                navigate('/');
            }
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, [currentUser, navigate]);

    // Filter orders to only show submitted orders
    const submittedOrders = allOrders.filter((order: Cart) => order.order_submitted === true);

    // Sort orders by date (newest first)
    const sortedOrders = [...submittedOrders].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const calculateOrderTotal = (order: Cart): number => {
        const subtotal = order.products.reduce(
            (total: number, item: CartItem) => total + (item.price * item.quantity), 
            0
        );
        const shipping = 5; // Default shipping
        const tax = subtotal * 0.08; // 8% tax
        return subtotal + shipping + tax;
    };

    const getOrderStatus = (order: Cart): { text: string; variant: string } => {
        if (order.order_delivered) {
            return { text: 'Delivered', variant: 'success' };
        } else if (order.order_fulfilled) {
            return { text: 'Fulfilled', variant: 'info' };
        } else if (order.order_paid) {
            return { text: 'Paid', variant: 'primary' };
        } else if (order.order_submitted) {
            return { text: 'Submitted', variant: 'warning' };
        }
        return { text: 'Processing', variant: 'secondary' };
    };

    const handleViewOrder = (order: Cart) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const handleCloseModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    if (isCheckingAuth) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading order history...</p>
                </div>
            </Container>
        );
    }

    if (!currentUser) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Please log in to view your order history</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Row className="mb-4">
                <Col>
                    <h1 className="fw-bold">Order History</h1>
                    <p className="text-muted">View your past orders and track their status</p>
                </Col>
            </Row>

            {sortedOrders.length === 0 ? (
                <Card className="text-center p-5">
                    <Card.Body>
                        <div className="mb-4">
                            <span className="material-symbols-outlined text-muted" style={{ fontSize: '4rem' }}>
                                receipt_long
                            </span>
                        </div>
                        <h3 className="text-muted mb-3">No Orders Yet</h3>
                        <p className="mb-4">You haven't placed any orders. Start shopping to see your order history here!</p>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Start Shopping
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {sortedOrders.map((order: Cart) => {
                        const status = getOrderStatus(order);
                        const total = calculateOrderTotal(order);
                        const itemCount = order.products.reduce((sum, item) => sum + item.quantity, 0);

                        return (
                            <Col key={order.oid} xs={12} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Row>
                                            <Col md={8}>
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h5 className="mb-1">Order #{order.oid}</h5>
                                                        <p className="text-muted mb-0">
                                                            <small>
                                                                Placed on {new Date(order.date).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </small>
                                                        </p>
                                                    </div>
                                                    <Badge bg={status.variant}>{status.text}</Badge>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="mb-2">
                                                        <strong>Items:</strong> {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                                    </p>
                                                    <div>
                                                        {order.products.slice(0, 3).map((item: CartItem, index: number) => (
                                                            <div key={item.ciid || index} className="text-muted small">
                                                                • {item.quantity}x {item.title.substring(0, 40)}
                                                                {item.title.length > 40 ? '...' : ''}
                                                            </div>
                                                        ))}
                                                        {order.products.length > 3 && (
                                                            <div className="text-muted small">
                                                                • and {order.products.length - 3} more item(s)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col md={4} className="d-flex flex-column justify-content-between align-items-end">
                                                <div className="text-end mb-3">
                                                    <p className="text-muted mb-0 small">Total</p>
                                                    <h4 className="mb-0">${total.toFixed(2)}</h4>
                                                </div>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleViewOrder(order)}
                                                >
                                                    View Details
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Order Details Modal */}
            <Modal show={showOrderModal} onHide={handleCloseModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Order Details - #{selectedOrder?.oid}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <p className="mb-2">
                                        <strong>Order Date:</strong><br />
                                        {new Date(selectedOrder.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    <p className="mb-2">
                                        <strong>Status:</strong><br />
                                        <Badge bg={getOrderStatus(selectedOrder).variant} className="mt-1">
                                            {getOrderStatus(selectedOrder).text}
                                        </Badge>
                                    </p>
                                </Col>
                            </Row>

                            <h5 className="mb-3">Order Items</h5>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th className="text-center">Quantity</th>
                                        <th className="text-end">Price</th>
                                        <th className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.products.map((item: CartItem, index: number) => (
                                        <tr key={item.ciid || index}>
                                            <td>{item.title}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">${item.price.toFixed(2)}</td>
                                            <td className="text-end">${(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <Row className="mt-4">
                                <Col md={6} className="offset-md-6">
                                    <ListGroup variant="flush">
                                        <ListGroup.Item className="d-flex justify-content-between">
                                            <span>Subtotal:</span>
                                            <span>
                                                ${selectedOrder.products.reduce(
                                                    (total, item) => total + (item.price * item.quantity), 
                                                    0
                                                ).toFixed(2)}
                                            </span>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between">
                                            <span>Shipping:</span>
                                            <span>$5.00</span>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between">
                                            <span>Tax (8%):</span>
                                            <span>
                                                ${(selectedOrder.products.reduce(
                                                    (total, item) => total + (item.price * item.quantity), 
                                                    0
                                                ) * 0.08).toFixed(2)}
                                            </span>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex justify-content-between fw-bold">
                                            <span>Total:</span>
                                            <span>${calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Col>
                            </Row>

                            {/* Order Status Timeline */}
                            <div className="mt-4">
                                <h5 className="mb-3">Order Status</h5>
                                <ListGroup>
                                    <ListGroup.Item 
                                        variant={selectedOrder.order_submitted ? 'success' : 'light'}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <span>Order Submitted</span>
                                        {selectedOrder.order_submitted && (
                                            <Badge bg="success">✓</Badge>
                                        )}
                                    </ListGroup.Item>
                                    <ListGroup.Item 
                                        variant={selectedOrder.order_paid ? 'success' : 'light'}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <span>Payment Confirmed</span>
                                        {selectedOrder.order_paid && (
                                            <Badge bg="success">✓</Badge>
                                        )}
                                    </ListGroup.Item>
                                    <ListGroup.Item 
                                        variant={selectedOrder.order_fulfilled ? 'success' : 'light'}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <span>Order Fulfilled</span>
                                        {selectedOrder.order_fulfilled && (
                                            <Badge bg="success">✓</Badge>
                                        )}
                                    </ListGroup.Item>
                                    <ListGroup.Item 
                                        variant={selectedOrder.order_delivered ? 'success' : 'light'}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <span>Order Delivered</span>
                                        {selectedOrder.order_delivered && (
                                            <Badge bg="success">✓</Badge>
                                        )}
                                    </ListGroup.Item>
                                </ListGroup>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default OrderHistory;
