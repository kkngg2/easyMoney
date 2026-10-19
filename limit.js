const defaultLimits = {
    totalLimit: 25000000,
    categories: {
        'Food & Beverage': { id: 1, emoji: '🍔', limit: 6000000 },
        'Shopping': { id: 2, emoji: '🛍️', limit: 4000000 },
        'Transportation': { id: 3, emoji: '🚗', limit: 2000000 },
        'Entertainment': { id: 4, emoji: '🎮', limit: 2000000 },
        'Bills': { id: 5, emoji: '📄', limit: 5000000 },
        'Emergency Fund': { id: 6, emoji: '🛡️', limit: 2000000 },
        'Other': { id: 7, emoji: '📦', limit: 4000000 }
    }
};

let spendingLimits = JSON.parse(localStorage.getItem('spendingLimits')) || defaultLimits;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

function displayCurrentMonthYear() {
    const monthYearElem = document.getElementById('currentMonthYear');
    if (monthYearElem) {
        const now = new Date();
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentMonth = monthNames[now.getMonth()];
        const currentYear = now.getFullYear();
        monthYearElem.innerText = `${currentMonth} ${currentYear}`;
    }
}

function renderData() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    const categorySpents = {
        'Food & Beverage': 0,
        'Shopping': 0,
        'Transportation': 0,
        'Entertainment': 0,
        'Bills': 0,
        'Emergency Fund': 0,
        'Other': 0
    };

    let totalSpent = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(tx => {
        if (tx.type === 'expense') {
            let txDate = new Date();
            if (tx.date) {
                txDate = new Date(tx.date);
            }
            const isSameMonth = txDate.getMonth() === currentMonth;
            const isSameYear = txDate.getFullYear() === currentYear;

            if (isSameMonth && isSameYear) {
                const amount = Number(tx.amount) || 0;
                if (categorySpents.hasOwnProperty(tx.category)) {
                    categorySpents[tx.category] += amount;
                } else {
                    categorySpents['Other'] += amount;
                }
                totalSpent += amount;
            }
        }
    });

    const totalRemaining = spendingLimits.totalLimit - totalSpent;
    const totalPercent = spendingLimits.totalLimit > 0 
        ? Math.min(((totalSpent / spendingLimits.totalLimit) * 100), 100).toFixed(1) 
        : 0;

    const displayTotalLimit = document.getElementById('displayTotalLimit');
    const displayTotalSpent = document.getElementById('displayTotalSpent');
    const displayTotalPercent = document.getElementById('displayTotalPercent');
    const displayTotalRemaining = document.getElementById('displayTotalRemaining');
    const totalProgressBar = document.getElementById('totalProgressBar');

    if (displayTotalLimit) displayTotalLimit.innerText = formatCurrency(spendingLimits.totalLimit);
    if (displayTotalSpent) displayTotalSpent.innerText = formatCurrency(totalSpent);
    if (displayTotalPercent) displayTotalPercent.innerText = `${totalPercent}%`;
    
    if (displayTotalRemaining) {
        displayTotalRemaining.innerText = formatCurrency(totalRemaining);
        displayTotalRemaining.style.color = totalRemaining < 0 ? '#ff4b4b' : '#58cc02';
    }
    
    if (totalProgressBar) {
        totalProgressBar.style.width = `${Math.min((totalSpent / spendingLimits.totalLimit) * 100, 100)}%`;
        totalProgressBar.style.backgroundColor = totalSpent > spendingLimits.totalLimit ? '#ff4b4b' : '#1cb0f6';
    }

    const container = document.getElementById('categoryContainer');
    if (container) {
        container.innerHTML = '';

        Object.keys(spendingLimits.categories).forEach(catName => {
            const cat = spendingLimits.categories[catName];
            const spent = categorySpents[catName] || 0;
            const rawPercent = cat.limit > 0 ? (spent / cat.limit) * 100 : 0;
            const percentFormatted = rawPercent.toFixed(1);
            const isOver = spent > cat.limit;
            const barColor = isOver ? '#ff4b4b' : '#58cc02';

            container.innerHTML += `
                <div class="sub-wallet-item" style="display: flex; flex-direction: column; gap: 8px; background-color: #f7f9fa; padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e5e5; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="sub-wallet-info">
                            <h4 style="font-size: 16px; display: flex; align-items: center; gap: 8px; margin: 0; color: #3c3c3c;">
                                <span>${cat.emoji}</span> ${catName}
                            </h4>
                            <span style="font-size: 13px; color: #777;">
                                Spent: <strong>${formatCurrency(spent)}</strong> / Limit: ${formatCurrency(cat.limit)}
                            </span>
                        </div>
                        <span style="font-weight: 800; font-size: 14px; color: ${barColor};">
                            ${percentFormatted}%
                        </span>
                    </div>
                    <div class="progress-container" style="width: 100%; height: 8px; background-color: #e5e5e5; border-radius: 10px; overflow: hidden;">
                        <div class="progress-bar" style="width: ${Math.min(rawPercent, 100)}%; height: 100%; background-color: ${barColor}; border-radius: 10px; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });
    }
}

function openModal() {
    const inputTotal = document.getElementById('inputTotalLimit');
    if (inputTotal) inputTotal.value = spendingLimits.totalLimit;

    const container = document.getElementById('modalCategoryInputs');
    if (container) {
        container.innerHTML = '';

        Object.keys(spendingLimits.categories).forEach(catName => {
            const cat = spendingLimits.categories[catName];
            container.innerHTML += `
                <div class="input-inline-group" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <label style="font-weight: 700; font-size: 14px; color: #324144; flex: 1; display: flex; align-items: center; gap: 6px;">
                        <span>${cat.emoji}</span> ${catName}
                    </label>
                    <input type="number" id="inputCat_${cat.id}" value="${cat.limit}" min="0" required style="flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px;">
                </div>
            `;
        });
    }

    const modal = document.getElementById('limitModal');
    if (modal) modal.classList.add('open');
}

function closeModal() {
    const modal = document.getElementById('limitModal');
    if (modal) modal.classList.remove('open');
}

function saveLimits(e) {
    e.preventDefault();
    
    const inputTotal = document.getElementById('inputTotalLimit');
    if (inputTotal) {
        spendingLimits.totalLimit = Number(inputTotal.value) || 0;
    }
    
    Object.keys(spendingLimits.categories).forEach(catName => {
        const cat = spendingLimits.categories[catName];
        const inputElem = document.getElementById(`inputCat_${cat.id}`);
        if (inputElem) {
            spendingLimits.categories[catName].limit = Number(inputElem.value) || 0;
        }
    });
    localStorage.setItem('spendingLimits', JSON.stringify(spendingLimits));
    renderData();
    closeModal();
}

document.addEventListener('DOMContentLoaded', () => {
    displayCurrentMonthYear();
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const limitForm = document.getElementById('limitForm');
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (limitForm) limitForm.addEventListener('submit', saveLimits);

    window.addEventListener('storage', (e) => {
        if (e.key === 'transactions' || e.key === 'spendingLimits') {
            renderData();
        }
    });
    renderData();
});