import Products from "../query/Products";
import Container from 'react-bootstrap/Container';
import { Col, Row } from "react-bootstrap";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useState, useEffect } from "react";
import axios from 'axios';

const Home: React.FC = () => {
    const [category, setCategory] = useState<string>("All");
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get("https://fakestoreapi.com/products/categories");
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);



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
                            {categories.map((cat: string, index: number) => (
                                <option key={index} value={cat}>{cat}</option>
                            ))}
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