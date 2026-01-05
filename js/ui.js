// js/ui.js

// 顯示提示訊息
export function showMessage(msg, type = 'success') {
    const box = document.getElementById('messageBox');
    box.textContent = msg;
    box.className = `p-4 rounded-2xl text-center font-bold mb-6 transition-all ${type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 3000);
}

// 設定冰塊甜度按鈕互動
export function setupOptions(containerId, hiddenInputId) {
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

// 設定選項的選取狀態 (用於編輯或帶入)
export function setOptionActive(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
        if(btn.dataset.value === value) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// 渲染列表
export function renderRecordList(records, handlers) {
    const recordList = document.getElementById('recordList');
    const recordCountText = document.getElementById('recordCount');
    const { onEdit, onDelete, onShare } = handlers;

    // 更新計數
    recordCountText.textContent = `${records.length} 筆紀錄`;
    
    if (records.length === 0) {
        recordList.innerHTML = `<p class="text-center py-10 text-stone-400">沒有符合條件的紀錄喔！</p>`;
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
            
            <div class="mt-4 flex justify-end gap-2">
                <button data-action="edit" data-id="${r.id}" class="text-blue-300 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button data-action="delete" data-id="${r.id}" class="text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button data-action="share" data-id="${r.id}" class="text-orange-300 hover:text-orange-500 p-2 rounded-full hover:bg-orange-50 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
            </div>
        </div> 
    `).join('');

    // 綁定按鈕事件 (使用事件委派)
    recordList.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const record = records.find(r => r.id === id);
            
            if (action === 'edit' && onEdit) onEdit(record);
            if (action === 'delete' && onDelete) onDelete(id);
            if (action === 'share' && onShare) onShare(record);
        });
    });
}

// 渲染最近常點
export function renderQuickOrders(records, onQuickFill) {
    const quickOrderList = document.getElementById('quickOrderList');
    const quickOrderSection = document.getElementById('quickOrderSection');
    
    const combos = new Map();
    records.forEach(r => {
        const key = `${r.store}-${r.item}-${r.ice}-${r.sugar}`;
        if (!combos.has(key)) combos.set(key, r);
    });

    const recentCombos = Array.from(combos.values()).slice(0, 6);

    if (recentCombos.length > 0) {
        quickOrderSection.classList.remove('hidden');
        quickOrderList.innerHTML = recentCombos.map(r => `
            <button class="quick-btn text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 px-3 py-2 rounded-xl hover:bg-orange-100 hover:scale-105 transition-all">
                ${r.store} · ${r.item} <span class="opacity-60">(${r.ice}/${r.sugar})</span>
            </button>
        `).join('');

        // 綁定事件
        const buttons = quickOrderList.querySelectorAll('.quick-btn');
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => onQuickFill(recentCombos[index]));
        });
    } else {
        quickOrderSection.classList.add('hidden');
    }
}

// 填入 datalist
export function updateDatalists(records) {
    const uniqueStores = [...new Set(records.map(r => r.store).filter(Boolean))];
    const uniqueItems = [...new Set(records.map(r => r.item).filter(Boolean))];
    document.getElementById('store-list').innerHTML = uniqueStores.map(s => `<option value="${s}">`).join('');
    document.getElementById('item-list').innerHTML = uniqueItems.map(i => `<option value="${i}">`).join('');
}