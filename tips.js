// Initialize sample data (stored in localStorage)
let tipsData = JSON.parse(localStorage.getItem('myBlogTipsEn')) || [
    {
        id: 1,
        title: "The 50/30/20 Rule for Personal Finance",
        category: "Finance",
        date: "2026-08-30",
        content: "Divide your income into three categories: 50% for needs, 30% for wants, and 20% dedicated to savings or investments."
    },
    {
        id: 2,
        title: "Grocery Shopping Without Overspending",
        category: "Budgeting",
        date: "2026-08-28",
        content: "Always make a shopping list beforehand and avoid grocery shopping on an empty stomach to prevent impulse buying."
    }
];

// DOM Elements
const container = document.getElementById('tipsContainer');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const tipModal = document.getElementById('tipModal');
const tipForm = document.getElementById('tipForm');
const modalTitle = document.getElementById('modalTitle');
const btnCreateTip = document.getElementById('btnCreateTip');
const btnCancel = document.getElementById('btnCancel');

// Render posts list
function renderTips() {
    const searchVal = searchInput.value.toLowerCase();
    const categoryVal = categorySelect.value;

    container.innerHTML = '';

    const filteredTips = tipsData.filter(tip => {
        const matchesSearch = tip.title.toLowerCase().includes(searchVal) || tip.content.toLowerCase().includes(searchVal);
        const matchesCategory = categoryVal === 'all' || tip.category === categoryVal;
        return matchesSearch && matchesCategory;
    });

    if (filteredTips.length === 0) {
        container.innerHTML = `<div class="history-card" style="text-align: center; color: #777;">No matching tips found.</div>`;
        return;
    }

    filteredTips.forEach(tip => {
        const card = document.createElement('article');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-header">
                <div>
                    <span class="goal-status-badge badge-in-progress">${tip.category}</span>
                    <h2 class="group-title" style="margin-top: 8px;">${tip.title}</h2>
                    <p class="subtitle">Posted on: ${tip.date} • Author: Admin</p>
                </div>
                <div class="goal-actions">
                    <button class="btn-icon edit-btn" onclick="editTip(${tip.id})">Edit</button>
                    <button class="btn-icon delete-btn" onclick="deleteTip(${tip.id})">Delete</button>
                </div>
            </div>
            <div style="line-height: 1.6; color: #3c3c3c; white-space: pre-line;">
                ${tip.content}
            </div>
        `;
        container.appendChild(card);
    });
}

// Modal management
function openModal(mode) {
    tipModal.classList.add('open');
    if (mode === 'add') {
        modalTitle.innerText = "Create New Tip";
        tipForm.reset();
        document.getElementById('tipId').value = '';
    }
}

function closeModal() {
    tipModal.classList.remove('open');
}

// Add or update tip
function handleFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('tipId').value;
    const title = document.getElementById('tipTitle').value;
    const category = document.getElementById('tipCategory').value;
    const content = document.getElementById('tipContent').value;

    if (id) {
        // Update
        const index = tipsData.findIndex(item => item.id == id);
        if (index !== -1) {
            tipsData[index].title = title;
            tipsData[index].category = category;
            tipsData[index].content = content;
        }
    } else {
        // Create
        const newTip = {
            id: Date.now(),
            title,
            category,
            content,
            date: new Date().toISOString().split('T')[0]
        };
        tipsData.unshift(newTip);
    }

    saveAndReload();
    closeModal();
}

// Edit tip
function editTip(id) {
    const tip = tipsData.find(item => item.id === id);
    if (!tip) return;

    document.getElementById('tipId').value = tip.id;
    document.getElementById('tipTitle').value = tip.title;
    document.getElementById('tipCategory').value = tip.category;
    document.getElementById('tipContent').value = tip.content;
    modalTitle.innerText = "Edit Tip";

    openModal('edit');
}

// Delete tip
function deleteTip(id) {
    if (confirm("Are you sure you want to delete this tip?")) {
        tipsData = tipsData.filter(item => item.id !== id);
        saveAndReload();
    }
}

// Save to localStorage and refresh UI
function saveAndReload() {
    localStorage.setItem('myBlogTipsEn', JSON.stringify(tipsData));
    renderTips();
}

// Event Listeners
btnCreateTip.addEventListener('click', () => openModal('add'));
btnCancel.addEventListener('click', closeModal);
tipForm.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', renderTips);
categorySelect.addEventListener('change', renderTips);

// Initial render
renderTips();