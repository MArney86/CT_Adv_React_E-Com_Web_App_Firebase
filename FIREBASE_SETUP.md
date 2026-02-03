# Firebase Configuration Setup

This project requires a Firebase configuration file that contains your Firebase project credentials. Since these credentials are sensitive, they are not included in the repository.

## Steps to Create Your Firebase Configuration

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Register Your Web App

1. In your Firebase project dashboard, click the **Web** icon (`</>`) to add a web app
2. Give your app a nickname (e.g., "E-Commerce App")
3. Check "Also set up Firebase Hosting" if desired (optional)
4. Click "Register app"

### 3. Get Your Firebase Configuration

After registering your app, Firebase will display your configuration object. It will look something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 4. Create the Configuration File

1. In your project, create a new file: `src/components/firebaseConfig.ts`
2. Copy and paste the following code into the file:

```typescript
import { getAuth, type Auth } from '@firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth };
```

3. Replace the placeholder values with your actual Firebase configuration values from step 3

### 5. Enable Firebase Services

In your Firebase Console, enable the following services:

#### Authentication
1. Go to **Build** > **Authentication**
2. Click "Get started"
3. Enable the sign-in methods you want to use (Email/Password, Google, etc.)

#### Firestore Database
1. Go to **Build** > **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" for development (configure security rules later)
4. Select a location for your database

### 6. Security Note

⚠️ **Important**: The `firebaseConfig.ts` file is already listed in `.gitignore` to prevent your credentials from being committed to version control. Make sure it stays there!

### 7. Verify Installation

After creating your configuration file, start the development server:

```bash
npm install
npm run dev
```

If everything is set up correctly, your app should connect to Firebase without errors.

## Troubleshooting

- **"Firebase: Error (auth/invalid-api-key)"**: Check that your `apiKey` is correct
- **"Firebase: Error (auth/project-not-found)"**: Verify your `projectId` matches your Firebase project
- **Module not found errors**: Make sure all Firebase packages are installed (`npm install`)

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
