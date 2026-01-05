// js/chart.js
let chartInstance = null;

export function updateChart(records) {
    const ctx = document.getElementById('storeChart');
    const chartSection = document.getElementById('chartSection');

    if (records.length === 0) {
        chartSection.classList.add('hidden');
        return;
    }
    
    chartSection.classList.remove('hidden');

    // 統計店家次數
    const storeCounts = {};
    records.forEach(r => {
        storeCounts[r.store] = (storeCounts[r.store] || 0) + 1;
    });

    // 排序取出前 5 名
    const sortedStores = Object.entries(storeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels = sortedStores.map(s => s[0]);
    const data = sortedStores.map(s => s[1]);

    // 如果圖表已存在，先銷毀
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 繪製新圖表
    chartInstance = new Chart(ctx, {
        type: 'bar', // 或 'pie', 'doughnut'
        data: {
            labels: labels,
            datasets: [{
                label: '喝過次數',
                data: data,
                backgroundColor: [
                    'rgba(251, 146, 60, 0.7)', // Orange-400
                    'rgba(253, 186, 116, 0.7)', // Orange-300
                    'rgba(254, 215, 170, 0.7)', // Orange-200
                    'rgba(255, 237, 213, 0.7)', // Orange-100
                    'rgba(255, 247, 237, 0.7)'  // Orange-50
                ],
                borderColor: 'rgba(249, 115, 22, 1)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}