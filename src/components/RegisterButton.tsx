import React, { useState, FormEvent } from "react";
import { createUserWithEmailAndPassword, type User} from "firebase/auth";
import { auth, db } from "./FirebaseConfig";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import { collection, setDoc, doc } from "firebase/firestore";

type RegisterButtonProps = {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const RegisterButton: React.FC<RegisterButtonProps> = ({ user, setUser }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>("");

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); // Clear any previous errors
        
        try {
            // createUserWithEmailAndPassword returns a UserCredential with the new user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user; // Get the newly created user
            
            // Now create the Firestore document using the new user's UID
            const userInfo = doc(db, "users", newUser.uid);
            await setDoc(userInfo, {id: newUser.uid, email: email, password: password, username: username }, { merge: true });
            
            alert("Registration successful!");
        } catch (err: any) {
            setError(err.message || "An error occurred during registration");
        }
    };


    return (
        <DropdownButton align="end" title="Register" variant="success" id="dropdown-btn-register" autoClose="outside">
            <Dropdown.Item>
                <Form >
                    <Form.Group controlId="formBasicUsername">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        />
                    </Form.Group>
                    
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

                    <Button variant="primary" type="submit" onClick={handleRegister}>
                        Register
                    </Button>
                    {error && <Alert variant="danger">{error}</Alert>}
                </Form>
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default RegisterButton;
