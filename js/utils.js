// js/utils.js

// 匯出 Excel
export function exportToExcel(records, userName = 'User') {
    if (records.length === 0) {
        return false;
    }

    // 整理資料格式
    const exportData = records.map(r => ({
        '日期': r.date,
        '店家': r.store,
        '品項': r.item,
        '價格': r.price || 0,
        '冰塊': r.ice,
        '甜度': r.sugar,
        '備註': r.note || ''
    }));

    // 建立工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "飲料紀錄");

    // 產生智慧檔名
    const dates = records.map(r => r.date).filter(Boolean).sort();
    const rangeStart = dates[0];
    const rangeEnd = dates[dates.length - 1];
    const fileName = `${userName}_飲料紀錄_${rangeStart}_${rangeEnd}.xlsx`;

    // 下載檔案
    XLSX.writeFile(wb, fileName);
    return true;
}

// 分享功能
export async function shareRecord(record) {
    const shareData = {
        title: '喝飲料囉！',
        text: `🥤 我在 ${record.store} 喝了 ${record.item} (${record.ice}/${record.sugar})！\n${record.note ? `📝 ${record.note}\n` : ''}\n快來一起紀錄 👉`,
        url: window.location.href
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert('已複製分享文字到剪貼簿！');
        }
    } catch (err) {
        console.log('分享取消或失敗', err);
    }
}
