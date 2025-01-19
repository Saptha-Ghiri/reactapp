import {initializeApp } from 'firebase/app'


import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyBa8bMLyNbWtkITet8aWw2dHLvZmBTr6HI",
    authDomain: "deepblue-877d5.firebaseapp.com",
    projectId: "deepblue-877d5",
    storageBucket: "deepblue-877d5.firebasestorage.app",
    messagingSenderId: "1033822869836",
    appId: "1:1033822869836:web:3e56a8721488d5c35d97e9",
    measurementId: "G-P5GBMKEEDH"
  };


initializeApp(firebaseConfig)

const db = getFirestore()

export{db}