// ----------------------------------------------------------- 
// ⬇️⬇️⬇️ Firebase 設定 (部署時會被替換) ⬇️⬇️⬇️
// ----------------------------------------------------------- 
// 正式環境使用佔位符
const firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// ----------------------------------------------------------- 
// ⬆️⬆️⬆️ Firebase 設定 ⬆️⬆️⬆️

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 初始化變數
let db;
let auth;
let drinksCollection;
let currentUser = null;
let unsubscribe = null; // 用來取消監聽

// 檢查並啟動 Firebase
if (!firebaseConfig.apiKey) {
    alert("⚠️ 請注意！\n\n找不到 Firebase 設定。請確保 firebase-env.js 存在或已設定環境變數。");
} else {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    drinksCollection = collection(db, "drinks");
    
    // 監聽登入狀態
    initAuth();
}

function initAuth() {
    const loginSection = document.getElementById('loginSection');
    const appSection = document.getElementById('appSection');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    // 登入按鈕
    loginBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .catch((error) => showMessage('登入失敗: ' + error.message, 'error'));
    });

    // 登出按鈕
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            showMessage('已登出 👋');
        });
    });

    // 狀態監聽
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (user) {
            // 已登入
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            userAvatar.src = user.photoURL;
            userName.textContent = user.displayName;
            startListening(user.uid);
        } else {
            // 未登入
            loginSection.classList.remove('hidden');
            appSection.classList.add('hidden');
            if (unsubscribe) unsubscribe(); // 停止監聽資料
            document.getElementById('recordList').innerHTML = ''; // 清空列表
        }
    });
}

// 監聽資料庫 (只監聽自己的資料)
function startListening(uid) {
    // 查詢條件：依時間排序，且 uid 必須等於當前使用者
    const q = query(
        drinksCollection, 
        where("uid", "==", uid),
        orderBy("timestamp", "desc")
    );
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        updateRecordList(records);
    }, (error) => {
        console.error("讀取資料失敗:", error);
        // 如果是因為剛建立索引還沒好，通常不用報錯給使用者，Firestore 會自動處理
        if (error.code !== 'failed-precondition') {
             showMessage("讀取資料失敗", "error");
        }
    });
}

// UI 互動邏輯
document.getElementById('date').valueAsDate = new Date();

function setupOptions(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!container) return;
    const buttons = container.querySelectorAll('button');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hiddenInput.value = btn.getAttribute('data-value');
        });
    });
}

setupOptions('iceOptions', 'iceValue');
setupOptions('sugarOptions', 'sugarValue');

// 表單提交
const drinkForm = document.getElementById('drinkForm');
const submitBtn = document.getElementById('submitBtn');

drinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        showMessage("請先登入", "error");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "紀錄中...";

    const drinkData = {
        uid: currentUser.uid, // 重要：寫入使用者 ID
        date: document.getElementById('date').value,
        store: document.getElementById('store').value,
        item: document.getElementById('item').value,
        ice: document.getElementById('iceValue').value,
        sugar: document.getElementById('sugarValue').value,
        note: document.getElementById('note').value,
        timestamp: serverTimestamp()
    };

    if (!drinkData.ice || !drinkData.sugar) {
        showMessage('別忘了選擇冰塊與甜度喔！', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = "收藏這杯紀錄";
        return;
    }

    try {
        await addDoc(drinksCollection, drinkData);
        drinkForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
        showMessage('成功紀錄一杯美味！✨');
    } catch (error) {
        showMessage('紀錄失敗：' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "收藏這杯紀錄";
    }
});

// 輔助函式
function showMessage(msg, type = 'success') {
    const box = document.getElementById('messageBox');
    box.textContent = msg;
    box.className = `p-4 rounded-2xl text-center font-bold mb-6 transition-all ${type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 3000);
}

function updateRecordList(records) {
    const recordList = document.getElementById('recordList');
    const recordCountText = document.getElementById('recordCount');
    
    recordCountText.textContent = `${records.length} 筆紀錄`;
    
    if (records.length === 0) {
        recordList.innerHTML = `<p class="text-center py-10 text-stone-400">目前還沒有紀錄喔！</p>`;
        return;
    }

    recordList.innerHTML = records.map(r => `
        <div class="border border-orange-100 bg-orange-50/20 p-5 rounded-2xl transition-all hover:bg-white hover:shadow-md">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black tracking-tighter text-orange-400 bg-white border border-orange-100 px-2 py-0.5 rounded-full uppercase">${r.date}</span>
                <span class="text-sm font-bold text-stone-500">${r.store}</span>
            </div>
            <div class="text-lg font-black text-stone-800 mb-3">${r.item}</div>
            <div class="flex gap-2 text-xs">
                <span class="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full">❄️ ${r.ice}</span>
                <span class="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">🍯 ${r.sugar}</span>
            </div>
            ${r.note ? `<div class="mt-4 pt-3 border-t border-orange-100/50 text-sm text-stone-500 italic"># ${r.note}</div>` : ''}
        </div> 
    `).join('');
}