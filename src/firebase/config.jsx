import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAIqy7ldlrSDooV4nhJ6I6bEpZ4W23nKZM",
  authDomain: "galyclubmanager.firebaseapp.com",
  projectId: "galyclubmanager",
  storageBucket: "galyclubmanager.appspot.com",
  messagingSenderId: "446172700750",
  appId: "1:446172700750:web:6cab3555bf3cb9b54ea31f"
};

// Init Firebase
firebase.initializeApp(firebaseConfig)

// initilize Services
const projectFirestore = firebase.firestore()
const projectAuth = firebase.auth()
const projectStorage = firebase.storage()

//Timestamp
const timestamp = firebase.firestore.Timestamp

// Exports to use in the App
export { projectFirestore, projectAuth , timestamp, projectStorage}
