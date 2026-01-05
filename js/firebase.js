// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 讀取設定
const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 初始化
let app, db, auth, drinksCollection;

if (!firebaseConfig.apiKey) {
    alert("⚠️ 找不到 Firebase 設定！");
} else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    drinksCollection = collection(db, "drinks");
}

// 匯出功能
export { db, auth, drinksCollection, serverTimestamp, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy, onSnapshot };

// 登入
export async function login() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        throw error;
    }
}

// 登出
export async function logout() {
    return signOut(auth);
}

// 監聽狀態
export function onUserChange(callback) {
    onAuthStateChanged(auth, callback);
}