import {useState, type FormEvent} from 'react';
import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { auth } from './FirebaseConfig';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import DropdownButton from 'react-bootstrap/esm/DropdownButton';

type LoginButtonProps = {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const LoginButton: React.FC<LoginButtonProps> = ({ user, setUser }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            setError("Please ensure you have a valid email and your password is longer than 6 characters.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Login successful!");
        } catch (err: any) {
            setError("Error Logging In: " + err.message);
        }
    };

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && password.length > 6;
    }

    const handleLogout = async () => {
        try {
            await signOut(auth);
            
            alert("Logout successful!");
        } catch (err: any) {
            setError("Error Logging Out: " + err.message);
        }
    };

    return (
        <>
        {user ? (
            <Button variant="primary" onClick={handleLogout}>Logout</Button>
        ) : (
            <div>
                <DropdownButton align="end" title="Login" variant="success" id="dropdown-btn-login" autoClose="outside">
                    <Dropdown.Item>
                        <Form>
                            <Form.Group controlId="formBasicEmail">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group controlId="formBasicPassword">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" onClick={handleLogin}>
                                Login
                            </Button>
                            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                        </Form>
                    </Dropdown.Item>
                </DropdownButton>
            </div>
        )}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </>
    )
}

export default LoginButton;