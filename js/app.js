// js/app.js
import * as FB from './firebase.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';
import * as Charts from './chart.js';

// 全域變數
let currentUser = null;
let allRecords = [];
let editingId = null;
let deleteTargetId = null;

// -----------------------------------------------------------
// 1. 定義所有處理函式 (Function Declarations)
// -----------------------------------------------------------

function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.add('hidden');
}

function handleDeleteRequest(id) {
    deleteTargetId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

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

function handleEdit(record) {
    editingId = record.id;
    document.getElementById('date').value = record.date;
    document.getElementById('price').value = record.price || '';
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
    UI.showMessage('正在編輯紀錄', 'success');
}

function handleQuickFill(record) {
    document.getElementById('store').value = record.store;
    document.getElementById('item').value = record.item;
    document.getElementById('price').value = record.price || '';
    if(record.note) document.getElementById('note').value = record.note;
    
    UI.setOptionActive('iceOptions', record.ice);
    document.getElementById('iceValue').value = record.ice;
    
    UI.setOptionActive('sugarOptions', record.sugar);
    document.getElementById('sugarValue').value = record.sugar;
    
    UI.showMessage('已帶入餐點！✨', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyFilter() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;

    let filtered = allRecords;
    if (startDate) filtered = filtered.filter(r => r.date >= startDate);
    if (endDate) filtered = filtered.filter(r => r.date <= endDate);

    UI.renderRecordList(filtered, {
        onEdit: handleEdit,
        onDelete: handleDeleteRequest,
        onShare: Utils.shareRecord
    });
}

async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) return UI.showMessage("請先登入", "error");

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;

    const drinkData = {
        uid: currentUser.uid,
        date: document.getElementById('date').value,
        price: document.getElementById('price').value,
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
    }
}

function startListening(uid) {
    const q = FB.query(FB.drinksCollection, FB.where("uid", "==", uid), FB.orderBy("timestamp", "desc"));
    
    FB.onSnapshot(q, (snapshot) => {
        allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        applyFilter(); 
        UI.renderQuickOrders(allRecords, handleQuickFill);
        UI.updateDatalists(allRecords);
        Charts.updateChart(allRecords);
    }, (error) => {
        console.error("Firebase Error:", error);
        if (error.code !== 'failed-precondition') UI.showMessage("讀取資料失敗", "error");
    });
}

// -----------------------------------------------------------
// 2. 初始化與事件綁定
// -----------------------------------------------------------

// 初始化 UI
document.getElementById('date').valueAsDate = new Date();
UI.setupOptions('iceOptions', 'iceValue');
UI.setupOptions('sugarOptions', 'sugarValue');
window.closeDeleteModal = closeDeleteModal;

// 綁定按鈕
document.getElementById('loginBtn').addEventListener('click', () => FB.login());
document.getElementById('logoutBtn').addEventListener('click', () => FB.logout());
document.getElementById('drinkForm').addEventListener('submit', handleSubmit);
document.getElementById('filterStartDate').addEventListener('input', applyFilter);
document.getElementById('filterEndDate').addEventListener('input', applyFilter);
document.getElementById('confirmDeleteBtn').addEventListener('click', handleConfirmDelete);

document.getElementById('exportBtn').addEventListener('click', () => {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    let filtered = allRecords;
    if (startDate) filtered = filtered.filter(r => r.date >= startDate);
    if (endDate) filtered = filtered.filter(r => r.date <= endDate);
    Utils.exportToExcel(filtered, currentUser ? currentUser.displayName : 'User');
});

// 監聽使用者狀態
FB.onUserChange((user) => {
    currentUser = user;
    const loginSection = document.getElementById('loginSection');
    const appSection = document.getElementById('appSection');
    if (user) {
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        document.getElementById('userAvatar').src = user.photoURL;
        document.getElementById('userName').textContent = user.displayName;
        startListening(user.uid);
    } else {
        loginSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        allRecords = [];
        UI.renderRecordList([], {});
    }
});