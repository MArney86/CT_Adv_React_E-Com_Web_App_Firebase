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

    // Initialize form fields when user data loads
    useEffect(() => {
        if (currentUser) {
            setUsername(currentUser.username || '');
            setEmail(currentUser.email || '');
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
            // Update username in Firestore
            if (username !== currentUser.username) {
                await dispatch(updateUserDetails({
                    uid: currentUser.uid,
                    details: { username }
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
                                            defaultValue={currentUser.uid}
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
                                                defaultValue={username || 'Not set'}
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
                                                defaultValue={email || 'Not set'}
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
                                            defaultValue={new Date(currentUser.created).toLocaleDateString()}
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
                                            defaultValue={currentUser.isActive ? 'Active' : 'Inactive'}
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
                                            defaultValue={currentUser.orders?.length || 0}
                                            className="bg-light px-2"
                                        />
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
