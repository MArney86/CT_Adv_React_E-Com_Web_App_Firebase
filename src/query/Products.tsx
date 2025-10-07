import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import type { Product } from '../interfaces/Product';
import { Rating } from '@smastrom/react-rating';
import { useDispatch } from 'react-redux';
import type { CartItem } from '../interfaces/CartItem';
import { addItem } from '../redux/slices/CartSlice';

const fetchProducts = async (): Promise<Product[]> => {
    const response = await axios.get('https://fakestoreapi.com/products');

    return response.data;
}

export default function Products({ category = "All"}: { category: string }) {
    const dispatch = useDispatch();
    
    const { data, isLoading, error } = useQuery<Product[], Error>({
        queryKey: ['products'],
        queryFn: fetchProducts,
    })

    if (isLoading) {
        return (
            <div>Loading...</div>
        );
    }

    if (error) {
        const errorMessage = error.message.includes('timeout') 
            ? 'Connection timeout. Please check your internet connection and try again.'
            : `Error: ${error.message}`;
        return <div>{errorMessage}</div>;
    }

    function addToCart(product: Product): void {
        const newCartItem: CartItem = {
            id: null,
            prodId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
        };
        dispatch(addItem(newCartItem));
        alert(`${product.title} added to cart!`);
    }

    return (
        <Container>
            <Row>
            {data?.filter(product => category === "All" || product.category === category)
                .map(product => (
                    <Col key={product.id} xxl={3} xl={4} lg={4} md={6} xs={12} className="mb-4">
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