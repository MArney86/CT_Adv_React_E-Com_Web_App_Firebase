import Products from "../query/Products";
import Container from 'react-bootstrap/Container';
import { Col, Row } from "react-bootstrap";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useState } from "react";
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const Home: React.FC = () => {
    const [category, setCategory] = useState<string>("All");

    const { data: categories, isLoading, error } = useQuery<string[], Error>({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await axios.get("https://fakestoreapi.com/products/categories");
            return response.data;
        }
    });

    if (isLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div>Loading categories...</div>
            </Container>
        );
    }

    if (error) {
        const errorMessage = error.message.includes('timeout') 
            ? 'Connection timeout. Please check your internet connection and try again.'
            : `Error: ${error.message}`;
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-danger">{errorMessage}</div>
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
                            {categories?.map((cat: string, index: number) => (
                                <option key={index} value={cat}>{cat}</option>
                            )) || <option disabled>No categories available</option>}
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