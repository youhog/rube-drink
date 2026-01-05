// js/app.js
import * as FB from './firebase.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';

// 全域變數
let currentUser = null;
let allRecords = [];
let editingId = null;
let deleteTargetId = null;

// 初始化 UI
document.getElementById('date').valueAsDate = new Date();
UI.setupOptions('iceOptions', 'iceValue');
UI.setupOptions('sugarOptions', 'sugarValue');

// 監聽使用者狀態
FB.onUserChange((user) => {
    currentUser = user;
    const loginSection = document.getElementById('loginSection');
    const appSection = document.getElementById('appSection');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

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
        allRecords = [];
        UI.renderRecordList([], {});
    }
});

// 監聽資料庫
function startListening(uid) {
    const q = FB.query(
        FB.drinksCollection, 
        FB.where("uid", "==", uid),
        FB.orderBy("timestamp", "desc")
    );
    
    FB.onSnapshot(q, (snapshot) => {
        allRecords = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // 資料更新時，重新渲染介面
        applyFilter(); 
        UI.renderQuickOrders(allRecords, handleQuickFill);
        UI.updateDatalists(allRecords);
        
    }, (error) => {
        console.error("讀取資料失敗:", error);
        if (error.code !== 'failed-precondition') {
             UI.showMessage("讀取資料失敗", "error");
        }
    });
}

// -----------------------------------------------------------
// 核心功能處理 (Handlers)
// -----------------------------------------------------------

// 篩選邏輯
function applyFilter() {
    if (!allRecords) return;

    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    let filtered = allRecords;

    if (startDate) filtered = filtered.filter(r => r.date >= startDate);
    if (endDate) filtered = filtered.filter(r => r.date <= endDate);

    // 渲染列表並傳入動作處理函式
    UI.renderRecordList(filtered, {
        onEdit: handleEdit,
        onDelete: handleDeleteRequest,
        onShare: Utils.shareRecord
    });
}

// 快速帶入處理
function handleQuickFill(record) {
    document.getElementById('store').value = record.store;
    document.getElementById('item').value = record.item;
    if(record.note) document.getElementById('note').value = record.note;
    
    UI.setOptionActive('iceOptions', record.ice);
    document.getElementById('iceValue').value = record.ice;
    
    UI.setOptionActive('sugarOptions', record.sugar);
    document.getElementById('sugarValue').value = record.sugar;
    
    UI.showMessage('已帶入餐點，確認日期後即可收藏！✨', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 編輯處理
function handleEdit(record) {
    editingId = record.id;
    document.getElementById('date').value = record.date;
    document.getElementById('store').value = record.store;
    document.getElementById('item').value = record.item;
    document.getElementById('note').value = record.note || '';
    
    UI.setOptionActive('iceOptions', record.ice);
    document.getElementById('iceValue').value = record.ice;
    
    UI.setOptionActive('sugarOptions', record.sugar);
    document.getElementById('sugarValue').value = record.sugar;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = "更新紀錄";
    submitBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
    submitBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    UI.showMessage('正在編輯紀錄，修改完請按更新按鈕', 'success');
}

// 刪除請求處理 (顯示 Modal)
function handleDeleteRequest(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// 確認刪除處理
async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = "刪除中...";

    try {
        await FB.deleteDoc(FB.doc(FB.db, "drinks", deleteTargetId));
        UI.showMessage('紀錄已刪除 🗑️');
        closeDeleteModal();
    } catch (error) {
        UI.showMessage('刪除失敗：' + error.message, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "刪除它";
    }
}

// 關閉刪除 Modal
function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

// 表單提交處理
async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
        UI.showMessage("請先登入", "error");
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = editingId ? "更新中..." : "紀錄中...";

    const drinkData = {
        uid: currentUser.uid,
        date: document.getElementById('date').value,
        store: document.getElementById('store').value,
        item: document.getElementById('item').value,
        ice: document.getElementById('iceValue').value,
        sugar: document.getElementById('sugarValue').value,
        note: document.getElementById('note').value,
        timestamp: FB.serverTimestamp()
    };

    if (!drinkData.ice || !drinkData.sugar) {
        UI.showMessage('別忘了選擇冰塊與甜度喔！', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = editingId ? "更新紀錄" : "收藏這杯紀錄";
        return;
    }

    try {
        if (editingId) {
            await FB.updateDoc(FB.doc(FB.db, "drinks", editingId), drinkData);
            UI.showMessage('紀錄已更新！✨');
            editingId = null;
            submitBtn.textContent = "收藏這杯紀錄";
            submitBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            submitBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
        } else {
            await FB.addDoc(FB.drinksCollection, drinkData);
            UI.showMessage('成功紀錄一杯美味！✨');
        }

        document.getElementById('drinkForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    } catch (error) {
        UI.showMessage('操作失敗：' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        if (!editingId) submitBtn.textContent = "收藏這杯紀錄";
    }
}

// -----------------------------------------------------------
// 事件綁定
// -----------------------------------------------------------

// 登入登出
document.getElementById('loginBtn').addEventListener('click', () => FB.login().catch(err => UI.showMessage(err.message, 'error')));
document.getElementById('logoutBtn').addEventListener('click', () => FB.logout().then(() => UI.showMessage('已登出 👋')));

// 表單
document.getElementById('drinkForm').addEventListener('submit', handleSubmit);

// 篩選器
document.getElementById('filterStartDate').addEventListener('input', applyFilter);
document.getElementById('filterEndDate').addEventListener('input', applyFilter);

// 刪除 Modal
document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);
// 點擊遮罩關閉 (需要將 closeDeleteModal 設為全域嗎？不用，我們直接綁定)
// 但原本 HTML 裡面的 onclick="closeDeleteModal()" 會找不到函式，所以我們要改用 JS 綁定
// 或者將 closeDeleteModal 掛載到 window 上
window.closeDeleteModal = closeDeleteModal; 

// 匯出
document.getElementById('exportBtn').addEventListener('click', () => {
    // 取得目前篩選後的資料
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    
    let filtered = allRecords;
    if (startDate) filtered = filtered.filter(r => r.date >= startDate);
    if (endDate) filtered = filtered.filter(r => r.date <= endDate);

    if (!Utils.exportToExcel(filtered, currentUser ? currentUser.displayName : 'User')) {
        UI.showMessage('目前沒有紀錄可以匯出喔！', 'error');
    }
});