const firebase = require("firebase/compat/app");
require("dotenv").config();
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
} = require("firebase/firestore");
const app = firebase.initializeApp({
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
});
const db = getFirestore(app);
const productRef = collection(db, "products");

const getProducts = () => {
  return getDocs(productRef);
};

module.exports = { getProducts };
