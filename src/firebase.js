import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7Fq7tkuzatOBqLRJcK_yBMF9-lX1ySwE",
  authDomain: "desafio11-68eb5.firebaseapp.com",
  projectId: "desafio11-68eb5",
  storageBucket: "desafio11-68eb5.firebasestorage.app",
  messagingSenderId: "777698848725",
  appId: "1:777698848725:web:98339a3c8d4afc3d67d75c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };