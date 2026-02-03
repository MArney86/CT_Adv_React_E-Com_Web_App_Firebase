import Products from "../query/Products";
import Container from 'react-bootstrap/Container';
import { Col, Row } from "react-bootstrap";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useState, useMemo } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store/store';

const Home: React.FC = () => {
    const [category, setCategory] = useState<string>("All");
    
    const products = useSelector((state: RootState) => state.products?.items || []);
    const productsStatus = useSelector((state: RootState) => state.products?.status);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const uniqueCategories = new Set<string>();
        products.forEach(product => {
            if (product.category) {
                uniqueCategories.add(product.category);
            }
        });
        return Array.from(uniqueCategories).sort();
    }, [products]);

    if (productsStatus === 'loading') {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div>Loading categories...</div>
            </Container>
        );
    }

    if (productsStatus === 'error') {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-danger">Error loading products. Please try again.</div>
            </Container>
        );
    }

    return (
        <Container>
            <Row className="justify-content-between mb-4">
                <Col className="d-flex align-items-center">
                    <h1>Welcome to FakeStore</h1>
                </Col>
                <Col className="d-flex justify-content-end">
                    <FloatingLabel controlId="category-select" label="Select Category" className="mb-3 w-50">
                        <select
                            className="form-select"
                            id="category-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}>
                            <option value="All">All</option>
                            {categories.length > 0 ? (
                                categories.map((cat: string, index: number) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))
                            ) : (
                                <option disabled>No categories available</option>
                            )}
                        </select>
                    </FloatingLabel>
                </Col>
            </Row>
            
            <Row>
                <Products category={category} />
            </Row>
        </Container>
    );
}

export default Home;