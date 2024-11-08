import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxOkpSZyG5Tq5GyuqFG2CnhqfkWdssqsU",
  authDomain: "e-sport-5483a.firebaseapp.com",
  projectId: "e-sport-5483a",
  storageBucket: "e-sport-5483a.appspot.com",
  messagingSenderId: "730449756980",
  appId: "1:730449756980:web:cab7457f0bc891da04db61"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
