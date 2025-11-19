import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container';
import InputGroup from 'react-bootstrap/InputGroup'
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Product } from '../interfaces/Product';
import type { CartItem } from '../interfaces/CartItem';
import type { CouponCode } from '../interfaces/CouponCode';
import type { RootState, AppDispatch } from '../redux/store/store';
import { removeItem, updateItemQuantity } from '../redux/slices/CartSlice';
import { updateCouponDetails } from '../redux/slices/CouponsSlice';

const fetchProducts = async (): Promise<Product[]> => {
    const response = await axios.get('https://fakestoreapi.com/products');

    return response.data;
}


const CartPage = () => {
    const [removeId, setRemoveId] = useState<number|null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [couponCode, setCouponCode] = useState<string>('');
    const [shipping, setShipping] = useState<number>(0);
    const [codeError, setCodeError] = useState<string>('');
    const [couponSuccess, setCouponSuccess] = useState<string>('');
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const couponCodes = useSelector((state: RootState) => state.coupons.codes);
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    
    console.log('CartPage: cartItems =', cartItems);
    console.log('CartPage: cartItems.length =', cartItems.length);
    if (cartItems.length > 0) {
        console.log('CartPage: First item =', cartItems[0]);
    }
    
    const { data } = useQuery<Product[], Error>({
            queryKey: ['products'],
            queryFn: fetchProducts,
        })

    const handleCouponCode = () => {
        setCodeError(''); // Clear previous errors
        setCouponSuccess(''); // Clear previous success message
        const foundCoupon = couponCodes.find((code: CouponCode) => code.code === couponCode);
        
        if (!foundCoupon) {
            setCodeError('Coupon code not found.');
            return;
        }

        if (!foundCoupon.isActive) {
            setCodeError('This coupon code is not active.');
            return;
        }

        if (foundCoupon.expiryDate.isSet && new Date(foundCoupon.expiryDate.date) < new Date()) {
            setCodeError('This coupon code has expired.');
            // Update coupon status to inactive
            dispatch(updateCouponDetails({ 
                ccid: foundCoupon.ccid, 
                details: { isActive: false } 
            }));
            return;
        }

        // Check minimum purchase requirement
        const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        if (foundCoupon.minPurchase.isSet && subtotal < foundCoupon.minPurchase.value) {
            setCodeError(`Minimum purchase of $${foundCoupon.minPurchase.value.toFixed(2)} required.`);
            return;
        }

        // Calculate discount
        const discountAmount = foundCoupon.isPercentage
            ? (subtotal * foundCoupon.discount) / 100
            : foundCoupon.discount;
        
        // Ensure discount doesn't exceed subtotal
        const finalDiscount = Math.min(discountAmount, subtotal);
            
        setCouponDiscount(finalDiscount);
        setCouponSuccess(`Coupon applied! You saved $${finalDiscount.toFixed(2)}`);
        setCodeError(''); // Clear any errors
    }

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty. Add some items before checking out.');
            return;
        }
        
        if (shipping === 0) {
            alert('Please select a shipping option before proceeding to checkout.');
            return;
        }

        // Navigate to checkout page with cart data
        navigate('/checkout', {
            state: {
                cartItems,
                shipping,
                couponDiscount,
                subtotal: cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
            }
        });
    }


    const handleQuantDecrement = (item: CartItem) => {
        if (!currentUser) {
            alert('Please login to modify cart');
            return;
        }
        
        if (item.ciid === null) {
            alert('Invalid item ID');
            return;
        }
        
        if (item.quantity - 1 < 1) {
            dispatch(removeItem({ ciid: item.ciid, uid: currentUser.uid }));
        } else {
            dispatch(updateItemQuantity({ id: item.ciid, quantity: item.quantity - 1, uid: currentUser.uid }));
        }
    };

    const handleQuantIncrement = (item: CartItem) => {
        if (!currentUser) {
            alert('Please login to modify cart');
            return;
        }
        
        if (item.ciid === null) {
            alert('Invalid item ID');
            return;
        }
        
        dispatch(updateItemQuantity({ id: item.ciid, quantity: item.quantity + 1, uid: currentUser.uid }));
    };

    const handleRemoveItem = (id: number|null) => {
        if (id === null) {
            alert('Item ID is null, cannot remove item')
            return;
        }

        if (!currentUser) {
            alert('Please login to remove items');
            return;
        }

        dispatch(removeItem({ ciid: id, uid: currentUser.uid }));
        alert('Item removed from cart!');
    }

    const confirmRemove = (
        <Popover id="popover-remove-item">
            <Popover.Header as="h3">Confirm Removal of Cart Item</Popover.Header>
            <Popover.Body>
                <p>Are you sure you want to remove this item from your cart?</p>
                <Button variant="danger" onClick={() => {handleRemoveItem(removeId); setRemoveId(null);}}>Yes, remove</Button>
                <Button variant="secondary" onClick={() => setRemoveId(null)}>No, keep it</Button>
            </Popover.Body>
        </Popover>
    );

    return (
        <Container className='py-3 h-justify-content-center align-items-center h-100'>
            <Card className="cart-card rounded-3">
                <Card.Body className="p-0">
                    <Row className="g-0">
                        <Col md={8} xs={12}>
                            <div className="p-5">
                                <div className="d-flex justify-content-between align-items-center mb-5">
                                    <h1 className="fw-bold mb-0 text-black">Your Cart</h1>
                                    <span className="mb-0 text-muted">{cartItems.length} items</span>
                                </div>
                                
                                <hr className='my-4' />

                                {cartItems.map((item: CartItem) => (
                                    <Row key={item.ciid} className='mb-4 d-flex justify-content-between align-items-center'>
                                        <Col md={2} xs={6}>
                                            {data?.find((product: Product) => product.pid === item.prodId)?.image ? (
                                                <Card.Img 
                                                    src={data.find((product: Product) => product.pid === item.prodId)?.image} 
                                                    alt={item.title} 
                                                />
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height: '100px' }}>
                                                    <span className="text-muted">No Image</span>
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={3} xs={6}>
                                            <h5 className='text-black mb-0'>{item.title}</h5>
                                        </Col>
                                        <Col md={3} xs={6} className='d-flex align-items-center'>
                                            <InputGroup>
                                                <Button onClick={() => handleQuantDecrement(item)} className='cart-btn'>
                                                    <span className="material-symbols-outlined">stat_minus_1</span>
                                                </Button>
                                                <Form.Control type="number" className='text-center' value={item.quantity} style={{ pointerEvents: 'none'}} readOnly />
                                                <Button onClick={() => handleQuantIncrement(item)} className='cart-btn'>
                                                    <span className="material-symbols-outlined">stat_1</span>
                                                </Button>
                                            </InputGroup>
                                        </Col>
                                        <Col md={3} xs={6}>
                                            <h5 className='text-end mb-0'>${(item.price * item.quantity).toFixed(2)}</h5>
                                        </Col>
                                        <Col md={1} xs={6} className='text-end'>
                                            <OverlayTrigger trigger="click" placement="top" overlay={confirmRemove}>
                                                <Button onClick={() => setRemoveId(item.ciid)}>
                                                    <span className="material-symbols-outlined">delete</span>
                                                </Button>
                                            </OverlayTrigger>
                                        </Col>
                                    </Row>
                                ))}
                            </div>
                        </Col>
                        <Col lg="4" className="bg-grey" md={4} xs={12}>
                            <div className="p-5">
                                <h3 className="fw-bold mb-5 mt-2 pt-1">
                                    Summary
                                </h3>

                                <hr className="my-4" />

                                <div className="d-flex justify-content-between mb-4">
                                    <h5 className="text-uppercase">
                                        items {cartItems.length}
                                    </h5>
                                    <h5>$ {cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}</h5>
                                </div>

                                <h5 className="text-uppercase mb-3">
                                    Shipping
                                </h5>
                                <div className="mb-4">
                                    <Form.Select id="cart-shipping" className="select p-2 rounded bg-grey w-100" value={shipping} onChange={e => setShipping(Number(e.target.value))}>
                                        <option value={0} disabled>Select your option</option>
                                        <option value={5}>Standard-Delivery - $5.00</option>
                                        <option value={12}>Express-Delivery - $12.00</option>
                                        <option value={23}>Overnight-Delivery - $23.00</option>
                                    </Form.Select>
                                </div>

                                <h5 className="text-uppercase mb-3">Coupon code</h5>

                                <InputGroup className="mb-5">
                                    <Button variant='outline-secondary' onClick={handleCouponCode}>
                                        Apply
                                    </Button>
                                    <Form.Control type="text" placeholder="Enter your code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
                                </InputGroup>
                                <div className="mb-5">
                                    {codeError && <Alert variant="warning" className="text-center">{codeError}</Alert>}
                                    {couponSuccess && <Alert variant="success" className="text-center">{couponSuccess}</Alert>}
                                </div>

                                <div className="d-flex justify-content-between mb-5">
                                    <h5 className="text-uppercase">
                                        Total price
                                    </h5>
                                    <h5>$ {(cartItems.reduce((total, item) => total + item.price * item.quantity, 0) + shipping - couponDiscount).toFixed(2)}</h5>
                                </div>

                                <Button 
                                    variant="dark" 
                                    size="lg" 
                                    className="w-100"
                                    onClick={handleCheckout}
                                    disabled={cartItems.length === 0}
                                >
                                    Checkout
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default CartPage;