import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CartItem } from '../interfaces/CartItem';
import type { RootState, AppDispatch } from '../redux/store/store';
import { updateOrderDetails } from '../redux/slices/OrdersSlice';
import { updateUserDetails } from '../redux/slices/UserSlice';
import { resetCart } from '../redux/slices/CartSlice';

interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface PaymentInfo {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
}

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get cart data from location state or fallback to Redux store
    const dispatch = useDispatch<AppDispatch>();
    const cartItemsFromRedux: CartItem[] = useSelector((state: RootState) => state.cart.items);
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const cartOid = useSelector((state: RootState) => state.cart.oid);
    const cartData: { cartItems: CartItem[]; shipping: number; couponDiscount: number } = location.state || {};
    const cartItems: CartItem[] = cartData.cartItems || cartItemsFromRedux;
    const shippingFromCart: number = cartData.shipping || 5;
    const couponDiscountFromCart: number = cartData.couponDiscount || 0;

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    });

    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<string>('credit-card');
    const shipping: number = shippingFromCart;
    const [couponDiscount] = useState<number>(couponDiscountFromCart);
    const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);

    const subtotal = cartItems.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax - couponDiscount;

    const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentInfoChange = (field: keyof PaymentInfo, value: string) => {
        setPaymentInfo(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        // Validate customer info
        if (!customerInfo.firstName) newErrors.push('First name is required');
        if (!customerInfo.lastName) newErrors.push('Last name is required');
        if (!customerInfo.email) newErrors.push('Email is required');
        if (!customerInfo.address) newErrors.push('Address is required');
        if (!customerInfo.city) newErrors.push('City is required');
        if (!customerInfo.zipCode) newErrors.push('Zip code is required');

        // Validate payment info for credit card
        if (paymentMethod === 'credit-card') {
            if (!paymentInfo.cardNumber) newErrors.push('Card number is required');
            if (!paymentInfo.expiryDate) newErrors.push('Expiry date is required');
            if (!paymentInfo.cvv) newErrors.push('CVV is required');
            if (!paymentInfo.cardholderName) newErrors.push('Cardholder name is required');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSubmitOrder = async () => {
        if (!validateForm()) {
            return;
        }

        if (!currentUser) {
            setErrors(['Please login to complete your order']);
            return;
        }

        if (cartOid === null) {
            setErrors(['No active cart found']);
            return;
        }

        try {
            // Update the cart/order to mark as submitted
            await dispatch(updateOrderDetails({ 
                oid: cartOid, 
                details: { 
                    current: false,
                    order_submitted: true 
                } 
            })).unwrap();

            // No need to update user's orders array here - it was already added at index 0 when cart was created

            // Show success message
            setOrderSuccess(true);
            
            // Clear local cart state
            dispatch(resetCart());
        } catch (error) {
            setErrors(['Failed to submit order. Please try again.']);
            console.error('Order submission error:', error);
        }
    };

    // Redirect to cart if no items
    if (cartItems.length === 0) {
        return (
            <Container className='py-3 d-flex justify-content-center align-items-center min-vh-100'>
                <Card className="text-center p-5">
                    <Card.Body>
                        <div className="mb-4">
                            <span className="material-symbols-outlined text-warning" style={{ fontSize: '4rem' }}>
                                shopping_cart
                            </span>
                        </div>
                        <h2 className="text-warning mb-3">Cart is Empty!</h2>
                        <p className="text-muted mb-4">
                            You need to add items to your cart before checking out.
                        </p>
                        <Button variant="primary" onClick={() => navigate('/cart')}>
                            Go to Cart
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    if (orderSuccess) {
        return (
            <Container className='py-3 d-flex justify-content-center align-items-center min-vh-100'>
                <Card className="text-center p-5">
                    <Card.Body>
                        <div className="mb-4">
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '4rem' }}>
                                check_circle
                            </span>
                        </div>
                        <h2 className="text-success mb-3">Order Successful!</h2>
                        <p className="text-muted mb-4">
                            Thank you for your purchase. Your order has been processed successfully.
                        </p>
                        <p className="fw-bold">Order Total: ${total.toFixed(2)}</p>
                        <Button variant="primary" onClick={() => navigate('/')}>Continue Shopping</Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className='py-3'>
            <Card className="cart-card rounded-3">
                <Card.Body className="p-0">
                    <Row className="g-0">
                        {/* Customer & Payment Info */}
                        <Col lg={8} md={8} xs={12}>
                            <div className="p-5">
                                <div className="d-flex justify-content-between align-items-center mb-5">
                                    <h1 className="fw-bold mb-0 text-black">Checkout</h1>
                                    <span className="mb-0 text-muted">{cartItems.length} items</span>
                                </div>

                                {errors.length > 0 && (
                                    <Alert variant="danger" className="mb-4">
                                        <ul className="mb-0">
                                            {errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </Alert>
                                )}

                                <hr className='my-4' />

                                {/* Customer Information */}
                                <h4 className="mb-4">Customer Information</h4>
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>First Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerInfo.firstName}
                                                onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                                                placeholder="Enter first name"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Last Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerInfo.lastName}
                                                onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                                                placeholder="Enter last name"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email *</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={customerInfo.email}
                                                onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                                                placeholder="Enter email"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                value={customerInfo.phone}
                                                onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                                                placeholder="Enter phone number"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Address *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={customerInfo.address}
                                        onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                                        placeholder="Enter street address"
                                    />
                                </Form.Group>

                                <Row className="mb-4">
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>City *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerInfo.city}
                                                onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                                                placeholder="Enter city"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>State</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerInfo.state}
                                                onChange={(e) => handleCustomerInfoChange('state', e.target.value)}
                                                placeholder="Enter state"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Zip Code *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={customerInfo.zipCode}
                                                onChange={(e) => handleCustomerInfoChange('zipCode', e.target.value)}
                                                placeholder="Enter zip code"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <hr className='my-4' />

                                {/* Payment Method */}
                                <h4 className="mb-4">Payment Method</h4>
                                <div className="mb-4">
                                    <Form.Check
                                        type="radio"
                                        id="credit-card"
                                        name="payment-method"
                                        label="Credit/Debit Card"
                                        value="credit-card"
                                        checked={paymentMethod === 'credit-card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mb-3"
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="paypal"
                                        name="payment-method"
                                        label="PayPal"
                                        value="paypal"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mb-3"
                                    />
                                    <Form.Check
                                        type="radio"
                                        id="apple-pay"
                                        name="payment-method"
                                        label="Apple Pay"
                                        value="apple-pay"
                                        checked={paymentMethod === 'apple-pay'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mb-3"
                                    />
                                </div>

                                {/* Credit Card Details */}
                                {paymentMethod === 'credit-card' && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Cardholder Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={paymentInfo.cardholderName}
                                                onChange={(e) => handlePaymentInfoChange('cardholderName', e.target.value)}
                                                placeholder="Enter cardholder name"
                                            />
                                        </Form.Group>
                                        
                                        <Form.Group className="mb-3">
                                            <Form.Label>Card Number *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={paymentInfo.cardNumber}
                                                onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                                                placeholder="1234 5678 9012 3456"
                                                maxLength={19}
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Expiry Date *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={paymentInfo.expiryDate}
                                                        onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                                                        placeholder="MM/YY"
                                                        maxLength={5}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>CVV *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={paymentInfo.cvv}
                                                        onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                                                        placeholder="123"
                                                        maxLength={4}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </>
                                )}

                                {/* Other payment methods simulation */}
                                {paymentMethod === 'paypal' && (
                                    <Alert variant="info" className="mb-4">
                                        <strong>PayPal Payment</strong><br />
                                        You will be redirected to PayPal to complete your payment.
                                    </Alert>
                                )}

                                {paymentMethod === 'apple-pay' && (
                                    <Alert variant="info" className="mb-4">
                                        <strong>Apple Pay</strong><br />
                                        Use Touch ID or Face ID to complete your payment.
                                    </Alert>
                                )}
                            </div>
                        </Col>

                        {/* Order Summary */}
                        <Col lg={4} md={4} xs={12} className="bg-grey">
                            <div className="p-5">
                                <h3 className="fw-bold mb-5 mt-2 pt-1">Order Summary</h3>

                                <hr className="my-4" />

                                {/* Cart Items */}
                                <div className="mb-4">
                                    {cartItems.map((item: CartItem) => (
                                        <div key={item.ciid} className="d-flex justify-content-between align-items-center mb-2">
                                            <div>
                                                <small className="text-muted">{item.quantity}x</small>
                                                <span className="ms-2">{item.title.substring(0, 20)}...</span>
                                            </div>
                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <span>Shipping:</span>
                                    <span>${shipping.toFixed(2)}</span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <span>Tax (8%):</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>

                                {couponDiscount > 0 && (
                                    <div className="d-flex justify-content-between mb-2 text-success">
                                        <span>Coupon Discount:</span>
                                        <span>-${couponDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between mb-5">
                                    <h5 className="text-uppercase fw-bold">Total:</h5>
                                    <h5 className="fw-bold">${total.toFixed(2)}</h5>
                                </div>

                                <Button 
                                    variant="dark" 
                                    size="lg" 
                                    className="w-100"
                                    onClick={handleSubmitOrder}
                                    disabled={cartItems.length === 0}
                                >
                                    Place Order
                                </Button>

                                <div className="text-center mt-3">
                                    <small className="text-muted">
                                        🔒 Your payment information is secure
                                    </small>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CheckoutPage;
