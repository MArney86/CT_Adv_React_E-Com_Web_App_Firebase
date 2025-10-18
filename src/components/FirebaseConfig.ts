import { getAuth, type Auth } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaMwTk1k6X9gCNAGmc1AJQ2j34q7Pgr1E",
  authDomain: "react-e-commerce-app-bfb13.firebaseapp.com",
  projectId: "react-e-commerce-app-bfb13",
  storageBucket: "react-e-commerce-app-bfb13.firebasestorage.app",
  messagingSenderId: "338202462813",
  appId: "1:338202462813:web:eb833b85ccd64c50a31bb4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth };
