import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import type { RootState, AppDispatch } from '../redux/store/store';
import { updateUserDetails, removeUserFromFirestore, userReset } from '../redux/slices/UserSlice';
import { auth } from './FirebaseConfig';
import { deleteUser, updatePassword, updateEmail } from 'firebase/auth';

const UserProfile = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const userStatus = useSelector((state: RootState) => state.user.status);
    
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    
    // Shipping info state
    const [shippingInfo, setShippingInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        physicalAddress: '',
        city: '',
        state: '',
        zipCode: ''
    });

    // Initialize form fields when user data loads
    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
            setShippingInfo({
                firstName: currentUser.shippingInfo?.firstName || '',
                lastName: currentUser.shippingInfo?.lastName || '',
                email: currentUser.shippingInfo?.email || '',
                phoneNumber: currentUser.shippingInfo?.phoneNumber || '',
                physicalAddress: currentUser.shippingInfo?.physicalAddress || '',
                city: currentUser.shippingInfo?.city || '',
                state: currentUser.shippingInfo?.state || '',
                zipCode: currentUser.shippingInfo?.zipCode || ''
            });
            setIsCheckingAuth(false);
        }
    }, [currentUser]);

    // Check Firebase auth state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user && !currentUser) {
                // No Firebase user and no Redux user - definitely not logged in
                navigate('/');
            }
            setIsCheckingAuth(false);
        });

        return () => unsubscribe();
    }, [currentUser, navigate]);

    const handleEdit = () => {
        setIsEditing(true);
        setSuccessMessage('');
        setErrorMessage('');
    };

    const handleCancel = () => {
        // Reset form fields to current user data
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
            setShippingInfo({
                firstName: currentUser.shippingInfo?.firstName || '',
                lastName: currentUser.shippingInfo?.lastName || '',
                email: currentUser.shippingInfo?.email || '',
                phoneNumber: currentUser.shippingInfo?.phoneNumber || '',
                physicalAddress: currentUser.shippingInfo?.physicalAddress || '',
                city: currentUser.shippingInfo?.city || '',
                state: currentUser.shippingInfo?.state || '',
                zipCode: currentUser.shippingInfo?.zipCode || ''
            });
        }
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);
        setErrorMessage('');
    };

    const validateForm = (): boolean => {
        if (!username.trim()) {
            setErrorMessage('Username cannot be empty');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('Please enter a valid email address');
            return false;
        }

        if (newPassword && newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters long');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }

        if (!currentUser) {
            setErrorMessage('No user logged in');
            return;
        }

        try {
            // Prepare updates object
            const updates: any = {};
            
            // Update username in Firestore
            if (username !== currentUser.username) {
                updates.username = username;
            }
            
            // Update shipping info with Firestore snake_case field names
            const hasShippingChanges = 
                shippingInfo.firstName !== currentUser.shippingInfo?.firstName ||
                shippingInfo.lastName !== currentUser.shippingInfo?.lastName ||
                shippingInfo.email !== currentUser.shippingInfo?.email ||
                shippingInfo.phoneNumber !== currentUser.shippingInfo?.phoneNumber ||
                shippingInfo.physicalAddress !== currentUser.shippingInfo?.physicalAddress ||
                shippingInfo.city !== currentUser.shippingInfo?.city ||
                shippingInfo.state !== currentUser.shippingInfo?.state ||
                shippingInfo.zipCode !== currentUser.shippingInfo?.zipCode;
            
            if (hasShippingChanges) {
                updates.shipping_info = {
                    first_name: shippingInfo.firstName,
                    last_name: shippingInfo.lastName,
                    email: shippingInfo.email,
                    phone_number: shippingInfo.phoneNumber,
                    address: shippingInfo.physicalAddress,
                    addr_city: shippingInfo.city,
                    addr_state: shippingInfo.state,
                    addr_zip_code: shippingInfo.zipCode
                };
            }
            
            // Save updates to Firestore
            if (Object.keys(updates).length > 0) {
                await dispatch(updateUserDetails({
                    uid: currentUser.uid,
                    details: updates
                })).unwrap();
            }

            // Update email in Firebase Auth and Firestore
            if (email !== currentUser.email && auth.currentUser) {
                await updateEmail(auth.currentUser, email);
                await dispatch(updateUserDetails({
                    uid: currentUser.uid,
                    details: { email }
                })).unwrap();
            }

            // Update password in Firebase Auth if provided
            if (newPassword && auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
            }

            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/requires-recent-login') {
                setErrorMessage('Please log out and log back in to update email or password');
            } else if (error && typeof error === 'object' && 'message' in error) {
                setErrorMessage(String(error.message) || 'Failed to update profile');
            } else {
                setErrorMessage('Failed to update profile');
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setErrorMessage('Please type DELETE to confirm');
            return;
        }

        if (!currentUser) {
            setErrorMessage('No user logged in');
            return;
        }

        try {
            // Delete user from Firestore
            await dispatch(removeUserFromFirestore(currentUser.uid)).unwrap();

            // Delete user from Firebase Auth
            if (auth.currentUser) {
                await deleteUser(auth.currentUser);
            }

            // Reset user state
            dispatch(userReset());

            // Close modal and navigate
            setShowDeleteModal(false);
            alert('Account deleted successfully');
            navigate('/');
        } catch (error: unknown) {
            console.error('Error deleting account:', error);
            if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/requires-recent-login') {
                setErrorMessage('Please log out and log back in to delete your account');
            } else if (error && typeof error === 'object' && 'message' in error) {
                setErrorMessage(String(error.message) || 'Failed to delete account');
            } else {
                setErrorMessage('Failed to delete account');
            }
            setShowDeleteModal(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading profile...</p>
                </div>
            </Container>
        );
    }

    if (!currentUser) {
        return (
            <Container className="py-5">
                <Alert variant="warning">Please log in to view your profile</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col lg={8} md={10}>
                    <Card>
                        <Card.Header className="bg-primary text-white">
                            <h2 className="mb-0">User Profile</h2>
                        </Card.Header>
                        <Card.Body>
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

                            <Form>
                                {/* User ID (read-only) */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>User ID:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={currentUser.uid}
                                            className="bg-light px-2"
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Username */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>Username:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Enter username"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={username || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Email */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>Email:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter email"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={email || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Account Created */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>Account Created:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={new Date(currentUser.created).toLocaleDateString()}
                                            className="bg-light px-2"
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Account Status */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>Account Status:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={currentUser.isActive ? 'Active' : 'Inactive'}
                                            className="bg-light px-2"
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Total Orders */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        <strong>Total Orders:</strong>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control 
                                            plaintext 
                                            readOnly 
                                            value={currentUser.orders?.length || 0}
                                            className="bg-light px-2"
                                        />
                                    </Col>
                                </Form.Group>

                                <hr className="my-4" />
                                <h5 className="mb-3">Shipping Information</h5>

                                {/* First Name */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        First Name:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.firstName}
                                                onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                                                placeholder="Enter first name"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.firstName || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Last Name */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        Last Name:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.lastName}
                                                onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                                                placeholder="Enter last name"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.lastName || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Shipping Email */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        Contact Email:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="email"
                                                value={shippingInfo.email}
                                                onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                                                placeholder="Enter contact email"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.email || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Phone Number */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        Phone Number:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="tel"
                                                value={shippingInfo.phoneNumber}
                                                onChange={(e) => setShippingInfo({...shippingInfo, phoneNumber: e.target.value})}
                                                placeholder="Enter phone number"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.phoneNumber || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Physical Address */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        Address:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.physicalAddress}
                                                onChange={(e) => setShippingInfo({...shippingInfo, physicalAddress: e.target.value})}
                                                placeholder="Enter street address"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.physicalAddress || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* City */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        City:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.city}
                                                onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                                                placeholder="Enter city"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.city || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* State */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        State:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.state}
                                                onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                                                placeholder="Enter state"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.state || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Zip Code */}
                                <Form.Group as={Row} className="mb-3">
                                    <Form.Label column sm={3}>
                                        Zip Code:
                                    </Form.Label>
                                    <Col sm={9}>
                                        {isEditing ? (
                                            <Form.Control
                                                type="text"
                                                value={shippingInfo.zipCode}
                                                onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                                                placeholder="Enter zip code"
                                            />
                                        ) : (
                                            <Form.Control 
                                                plaintext 
                                                readOnly 
                                                value={shippingInfo.zipCode || 'Not set'}
                                                className="bg-light px-2"
                                            />
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Password fields (only show in edit mode) */}
                                {isEditing && (
                                    <>
                                        <hr className="my-4" />
                                        <h5 className="mb-3">Change Password (Optional)</h5>
                                        
                                        <Form.Group as={Row} className="mb-3">
                                            <Form.Label column sm={3}>
                                                New Password:
                                            </Form.Label>
                                            <Col sm={9}>
                                                <Form.Control
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter new password (min 6 characters)"
                                                />
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} className="mb-3">
                                            <Form.Label column sm={3}>
                                                Confirm Password:
                                            </Form.Label>
                                            <Col sm={9}>
                                                <Form.Control
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm new password"
                                                />
                                            </Col>
                                        </Form.Group>
                                    </>
                                )}

                                <hr className="my-4" />

                                {/* Action Buttons */}
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        {isEditing ? (
                                            <>
                                                <Button 
                                                    variant="success" 
                                                    onClick={handleSave}
                                                    disabled={userStatus === 'loading'}
                                                    className="me-2"
                                                >
                                                    {userStatus === 'loading' ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    onClick={handleCancel}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <Button 
                                                variant="primary" 
                                                onClick={handleEdit}
                                            >
                                                Edit Profile
                                            </Button>
                                        )}
                                    </div>
                                    
                                    <Button 
                                        variant="danger" 
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={isEditing}
                                    >
                                        Delete Account
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>Delete Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <strong>Warning:</strong> This action cannot be undone!
                    </Alert>
                    <p>
                        Deleting your account will permanently remove all your data, including:
                    </p>
                    <ul>
                        <li>Profile information</li>
                        <li>Order history</li>
                        <li>Account preferences</li>
                    </ul>
                    <p className="mb-3">
                        Type <strong>DELETE</strong> to confirm:
                    </p>
                    <Form.Control
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                    />
                    {errorMessage && (
                        <Alert variant="danger" className="mt-3">
                            {errorMessage}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText('');
                        setErrorMessage('');
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE'}
                    >
                        Delete My Account
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserProfile;
