import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Product } from '../interfaces/Product';
import { Rating } from '@smastrom/react-rating';
import { useDispatch, useSelector } from 'react-redux';
import type { CartItem } from '../interfaces/CartItem';
import { addItem } from '../redux/slices/CartSlice';
import { fetchProducts } from '../redux/slices/ProductsSlice';
import type { RootState, AppDispatch } from '../redux/store/store';
import { useEffect } from 'react';

export default function Products({ category = "All"}: { category: string }) {
    const dispatch = useDispatch<AppDispatch>();
    const products = useSelector((state: RootState) => state.products.items);
    const productsStatus = useSelector((state: RootState) => state.products.status);
    const productsError = useSelector((state: RootState) => state.products.error);
    const currentUser = useSelector((state: RootState) => state.user.currentUser);

    useEffect(() => {
        // Fetch products on component mount
        if (products.length === 0 && productsStatus === 'idle') {
            dispatch(fetchProducts());
        }
    }, [dispatch, products.length, productsStatus]);

    function addToCart(product: Product): void {
        if (!currentUser || !currentUser.uid) {
            alert('Please log in to add items to cart');
            return;
        }
        
        const newCartItem: CartItem = {
            ciid: 0, // This will be set in the reducer
            prodId: product.pid,
            title: product.title,
            price: product.price,
            quantity: 1,
        };
        dispatch(addItem({item: newCartItem, uid: currentUser.uid}));
        alert(`${product.title} added to cart!`);
    }

    if (productsStatus === 'loading') {
        return <Container><p>Loading products...</p></Container>;
    }

    if (productsStatus === 'error') {
        return <Container><p>Error: {productsError}</p></Container>;
    }

    return (
        <Container>
            <Row>
            {products?.filter((product: Product) => category === "All" || product.category === category)
                .map((product: Product) => (
                    <Col key={product.pid} xxl={3} xl={4} lg={4} md={6} xs={12} className="mb-4">
                        <Card className="product-card d-flex flex-column">
                            <Card.Header className="text-center">
                                <Card.Title className='product-card-title'>{product.title}</Card.Title>
                            </Card.Header>
                            <Card.Body className='product-card-body'>
                                <Container fluid className="product-card-img justify-content-center align-items-center">
                                    <Card.Img variant="top" src={product.image} alt={product.title}/>
                                </Container>
                                <Card.Text className='product-card-desc'>{product.description}</Card.Text>
                                <Card.Text className='product-card-price'>Price: ${product.price.toFixed(2)}</Card.Text>
                                <Card.Text className='product-card-category'>Category: {product.category}</Card.Text>
                                <Rating style={{ maxWidth: 250 }} value={product.rating.rate} readOnly />
                                <Card.Text className='small-text'>Rating: {product.rating.rate} ({product.rating.count} reviews)</Card.Text>
                            </Card.Body>
                            <Card.Footer className='product-card-btn'>
                                <Button className='btn_product' variant='primary' onClick={() => addToCart(product)}>Add to Cart</Button>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}