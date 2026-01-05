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
import { getFirestore, collection, addDoc, query, orderBy, where, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 初始化變數
let db;
let auth;
let drinksCollection;
let currentUser = null;
let unsubscribe = null; // 用來取消監聽
let editingId = null; // 記錄正在編輯的文件 ID

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
// ... (保留 initAuth 等函式) ...

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
    submitBtn.textContent = editingId ? "更新中..." : "紀錄中...";

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
        submitBtn.textContent = editingId ? "更新紀錄" : "收藏這杯紀錄";
        return;
    }

    try {
        if (editingId) {
            // 更新現有資料
            await updateDoc(doc(db, "drinks", editingId), drinkData);
            showMessage('紀錄已更新！✨');
            editingId = null;
            submitBtn.textContent = "收藏這杯紀錄";
            submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
        } else {
            // 新增資料
            await addDoc(drinksCollection, drinkData);
            showMessage('成功紀錄一杯美味！✨');
        }

        drinkForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    } catch (error) {
        showMessage('操作失敗：' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        if (!editingId) submitBtn.textContent = "收藏這杯紀錄";
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
    
    // --- 新增：自動更新建議清單 (Autocomplete) ---
    // 1. 取出所有店家名稱，過濾重複與空白
    const uniqueStores = [...new Set(records.map(r => r.store).filter(Boolean))];
    // 2. 取出所有飲料名稱，過濾重複與空白
    const uniqueItems = [...new Set(records.map(r => r.item).filter(Boolean))];
    
    // 3. 填入 datalist
    document.getElementById('store-list').innerHTML = uniqueStores.map(s => `<option value="${s}">`).join('');
    document.getElementById('item-list').innerHTML = uniqueItems.map(i => `<option value="${i}">`).join('');
    // ------------------------------------------

    recordCountText.textContent = `${records.length} 筆紀錄`;
    
    if (records.length === 0) {
        recordList.innerHTML = `<p class="text-center py-10 text-stone-400">目前還沒有紀錄喔！</p>`;
        return;
    }

    recordList.innerHTML = records.map(r => `
        <div class="border border-orange-100 bg-orange-50/20 p-5 rounded-2xl transition-all hover:bg-white hover:shadow-md group relative">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black tracking-tighter text-orange-400 bg-white border border-orange-100 px-2 py-0.5 rounded-full uppercase">${r.date}</span>
                <span class="text-sm font-bold text-stone-500">${r.store}</span>
            </div>
            <div class="text-lg font-black text-stone-800 mb-3">${r.item}</div>
            <div class="flex gap-2 text-xs mb-3">
                <span class="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full">❄️ ${r.ice}</span>
                <span class="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">🍯 ${r.sugar}</span>
            </div>
            ${r.note ? `<div class="pt-3 border-t border-orange-100/50 text-sm text-stone-500 italic"># ${r.note}</div>` : ''}
            
            <div class="absolute bottom-4 right-4 flex gap-2">
                 <!-- 編輯按鈕 -->
                <button onclick="editDrink('${r.id}', '${r.date}', '${r.store}', '${r.item}', '${r.ice}', '${r.sugar}', '${r.note || ''}')" 
                    class="text-blue-300 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-all"
                    title="編輯">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <!-- 刪除按鈕 -->
                <button onclick="deleteDrink('${r.id}')" 
                    class="text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                    title="刪除">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                <!-- 分享按鈕 -->
                <button onclick="shareDrink('${r.store}', '${r.item}', '${r.ice}', '${r.sugar}', '${r.note || ''}')" 
                    class="text-orange-300 hover:text-orange-500 p-2 rounded-full hover:bg-orange-50 transition-all"
                    title="分享這杯">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
            </div>
        </div> 
    `).join('');
}

// 刪除功能
window.deleteDrink = async (id) => {
    if (confirm('確定要刪除這筆紀錄嗎？此動作無法復原。')) {
        try {
            await deleteDoc(doc(db, "drinks", id));
            showMessage('紀錄已刪除 🗑️');
        } catch (error) {
            showMessage('刪除失敗：' + error.message, 'error');
        }
    }
};

// 編輯功能
window.editDrink = (id, date, store, item, ice, sugar, note) => {
    editingId = id; // 設定正在編輯的 ID
    
    // 填回表單
    document.getElementById('date').value = date;
    document.getElementById('store').value = store;
    document.getElementById('item').value = item;
    document.getElementById('note').value = note;
    
    // 處理按鈕選取狀態
    document.getElementById('iceValue').value = ice;
    document.querySelectorAll('#iceOptions button').forEach(btn => {
        if(btn.dataset.value === ice) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.getElementById('sugarValue').value = sugar;
    document.querySelectorAll('#sugarOptions button').forEach(btn => {
        if(btn.dataset.value === sugar) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // 改變按鈕狀態提示使用者
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = "更新紀錄";
    submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
    submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

    // 捲動到頂部讓使用者看到表單
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showMessage('正在編輯紀錄，修改完請按更新按鈕', 'success');
};

// 分享功能 (掛載到 window 以便 onclick 呼叫)
window.shareDrink = async (store, item, ice, sugar, note) => {
    const shareData = {
        title: '喝飲料囉！',
        text: `🥤 我在 ${store} 喝了 ${item} (${ice}/${sugar})！\n${note ? `📝 ${note}\n` : ''}\n快來一起紀錄 👉`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // 電腦版或不支援 Web Share 的備案：複製文字
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert('已複製分享文字到剪貼簿！');
        }
    } catch (err) {
        console.log('分享取消或失敗', err);
    }
};