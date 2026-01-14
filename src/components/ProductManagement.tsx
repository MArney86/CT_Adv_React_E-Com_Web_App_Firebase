import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import type { RootState, AppDispatch } from '../redux/store/store';
import type { Product } from '../interfaces/Product';
import { addProduct, updateProductDetails, removeProductFromFirestore } from '../redux/slices/ProductsSlice';
import { auth } from './FirebaseConfig';

const ProductManagement = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const products = useSelector((state: RootState) => state.products.items);
    const productsStatus = useSelector((state: RootState) => state.products.status);

    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        description: '',
        category: '',
        image: '',
        comment: ''
    });

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

    const handleShowAddModal = () => {
        setFormData({
            title: '',
            price: '',
            description: '',
            category: '',
            image: '',
            comment: ''
        });
        setShowAddModal(true);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleShowEditModal = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            title: product.title,
            price: product.price.toString(),
            description: product.description,
            category: product.category,
            image: product.image,
            comment: product.comment || ''
        });
        setShowEditModal(true);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleShowDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
        setErrorMessage('');
    };

    const handleCloseModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedProduct(null);
        setFormData({
            title: '',
            price: '',
            description: '',
            category: '',
            image: '',
            comment: ''
        });
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setErrorMessage('Product title is required');
            return false;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            setErrorMessage('Valid price is required');
            return false;
        }
        if (!formData.category.trim()) {
            setErrorMessage('Category is required');
            return false;
        }
        if (!formData.image.trim()) {
            setErrorMessage('Image URL is required');
            return false;
        }
        return true;
    };

    const handleAddProduct = async () => {
        if (!validateForm() || !currentUser) {
            return;
        }

        try {
            const newProduct: Product = {
                pid: Date.now(), // Generate unique ID
                title: formData.title,
                price: parseFloat(formData.price),
                description: formData.description,
                category: formData.category,
                image: formData.image,
                isActive: true,
                isDiscontinued: false,
                removed: {
                    isRemoved: false,
                    removedDate: null
                },
                rating: {
                    rate: 0,
                    count: 0
                },
                creatorUid: currentUser.uid,
                comment: formData.comment
            };

            await dispatch(addProduct(newProduct)).unwrap();
            setSuccessMessage('Product added successfully!');
            handleCloseModals();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            setErrorMessage(`Failed to add product. Please try again. ${error.message}`);
        }
    };

    const handleUpdateProduct = async () => {
        if (!validateForm() || !selectedProduct) {
            return;
        }

        try {
            const updates: Partial<Product> = {
                title: formData.title,
                price: parseFloat(formData.price),
                description: formData.description,
                category: formData.category,
                image: formData.image,
                comment: formData.comment
            };

            await dispatch(updateProductDetails({
                pid: selectedProduct.pid,
                details: updates
            })).unwrap();

            setSuccessMessage('Product updated successfully!');
            handleCloseModals();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            setErrorMessage(`Failed to update product. Please try again. ${error.message}`);
        }
    };

    const handleToggleActive = async (product: Product) => {
        try {
            await dispatch(updateProductDetails({
                pid: product.pid,
                details: { isActive: !product.isActive }
            })).unwrap();
            setSuccessMessage(`Product ${!product.isActive ? 'activated' : 'deactivated'} successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            setErrorMessage(`Failed to update product status. ${error.message}`);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        try {
            await dispatch(removeProductFromFirestore(selectedProduct.pid)).unwrap();
            setSuccessMessage('Product deleted successfully!');
            handleCloseModals();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Failed to delete product. Please try again.');
            handleCloseModals();
        }
    };

    if (isCheckingAuth) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading...</p>
                </div>
            </Container>
        );
    }

    if (!currentUser) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Please log in to manage products</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h1>Product Management</h1>
                        <Button variant="primary" onClick={handleShowAddModal}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', verticalAlign: 'middle' }}>
                                add
                            </span>
                            {' '}Add New Product
                        </Button>
                    </div>
                </Col>
            </Row>

            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            {errorMessage && (
                <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
                    {errorMessage}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {productsStatus === 'loading' ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading products...</span>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <Alert variant="info">No products found. Add your first product to get started!</Alert>
                    ) : (
                        <Table responsive hover>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Price</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Creator</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.pid}>
                                        <td>
                                            <img 
                                                src={product.image} 
                                                alt={product.title}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50';
                                                }}
                                            />
                                        </td>
                                        <td>{product.pid}</td>
                                        <td>
                                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {product.title}
                                            </div>
                                        </td>
                                        <td>${product.price.toFixed(2)}</td>
                                        <td>
                                            <Badge bg="secondary">{product.category}</Badge>
                                        </td>
                                        <td>
                                            <Badge bg={product.isActive ? 'success' : 'warning'}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <small className="text-muted">
                                                {product.creatorUid === 'FAKESTOREAPI' ? 'API' : 'User'}
                                            </small>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => handleShowEditModal(product)}
                                                    title="Edit product"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                        edit
                                                    </span>
                                                </Button>
                                                <Button 
                                                    variant={product.isActive ? 'outline-warning' : 'outline-success'}
                                                    size="sm"
                                                    onClick={() => handleToggleActive(product)}
                                                    title={product.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                        {product.isActive ? 'toggle_on' : 'toggle_off'}
                                                    </span>
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleShowDeleteModal(product)}
                                                    title="Delete product"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                        delete
                                                    </span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Add Product Modal */}
            <Modal show={showAddModal} onHide={handleCloseModals} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Product Title *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter product title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., electronics, clothing"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image URL *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Comments</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Additional notes"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            />
                        </Form.Group>

                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModals}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddProduct}>
                        Add Product
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Product Modal */}
            <Modal show={showEditModal} onHide={handleCloseModals} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Product</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Product Title *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter product title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., electronics, clothing"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Image URL *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Comments</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Additional notes"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            />
                        </Form.Group>

                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModals}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateProduct}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleCloseModals}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this product?</p>
                    {selectedProduct && (
                        <Card className="mt-3">
                            <Card.Body>
                                <div className="d-flex align-items-center gap-3">
                                    <img 
                                        src={selectedProduct.image} 
                                        alt={selectedProduct.title}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                                        }}
                                    />
                                    <div>
                                        <h6>{selectedProduct.title}</h6>
                                        <p className="mb-0 text-muted">ID: {selectedProduct.pid}</p>
                                        <p className="mb-0">${selectedProduct.price.toFixed(2)}</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                    <Alert variant="warning" className="mt-3 mb-0">
                        <strong>Warning:</strong> This action cannot be undone!
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModals}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteProduct}>
                        Delete Product
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ProductManagement;
