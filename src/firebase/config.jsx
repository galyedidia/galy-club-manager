import { initializeApp } from 'firebase/app'
import { getFirestore, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAIqy7ldlrSDooV4nhJ6I6bEpZ4W23nKZM",
  authDomain: "galyclubmanager.firebaseapp.com",
  projectId: "galyclubmanager",
  storageBucket: "galyclubmanager.appspot.com",
  messagingSenderId: "446172700750",
  appId: "1:446172700750:web:6cab3555bf3cb9b54ea31f"
};

// Init Firebase App
const app = initializeApp(firebaseConfig)

// Initialize Services
const projectFirestore = getFirestore(app)
const projectAuth = getAuth(app)
const projectStorage = getStorage(app)

// Timestamp
const timestamp = Timestamp

// Exports to use in the App
export { projectFirestore, projectAuth, timestamp, projectStorage, app }
