import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const NotFound = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <Container fluid className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
            <Row className="justify-content-center w-100">
                <Col xs={12} sm={10} md={8} lg={6} xl={5}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="text-center p-5">
                            <h1 className="display-1 fw-bold text-danger mb-3">404</h1>
                            <h2 className="h3 text-secondary mb-4">Page Not Found</h2>
                            <p className="text-muted fs-5 mb-4">
                                Sorry, the page you are looking for doesn't exist.
                            </p>
                            <p className="text-secondary mb-4">
                                Redirecting to homepage in{' '}
                                <span className="fw-bold text-primary fs-4">{countdown}</span>{' '}
                                seconds...
                            </p>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                onClick={handleGoHome}
                                className="px-4 py-2"
                            >
                                Go Home Now
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default NotFound;
