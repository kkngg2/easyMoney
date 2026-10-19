let wallets = JSON.parse(localStorage.getItem('my_wallets')) || [
  { id: 1, type: '💰 Cash', name: 'Dining', amount: 2000000, currency: 'VNĐ' },
  { id: 2, type: '💳 E-Wallet', name: 'MoMo', amount: 1500000, currency: 'VNĐ' },
  { id: 3, type: '🏦 Bank Account', name: 'Vietcombank', amount: 12000000, currency: 'VNĐ' }
];

let selectedWalletId = null;

function saveWallets() {
  localStorage.setItem('my_wallets', JSON.stringify(wallets));
  renderWallets();
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
}

function renderWallets() {
  const container = document.getElementById('wallet-groups-container');
  container.innerHTML = '';

  const groups = ['💰 Cash', '💳 E-Wallet', '🏦 Bank Account'];

  groups.forEach(groupType => {
    const groupWallets = wallets.filter(w => w.type === groupType);
    const totalVND = groupWallets.filter(w => w.currency === 'VNĐ').reduce((sum, w) => sum + Number(w.amount), 0);
    const totalUSD = groupWallets.filter(w => w.currency === 'USD').reduce((sum, w) => sum + Number(w.amount), 0);

    let totalText = [];
    if (totalVND > 0 || (totalVND === 0 && totalUSD === 0)) totalText.push(formatMoney(totalVND, 'VNĐ'));
    if (totalUSD > 0) totalText.push(formatMoney(totalUSD, 'USD'));

    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';

    let subWalletsHTML = groupWallets.map(w => `
      <div class="sub-wallet-item">
        <div class="sub-wallet-info">
          <h4>${w.name}</h4>
          <span class="amount">${formatMoney(w.amount, w.currency)}</span>
        </div>
        <div>
          <button class="btn-icon edit-btn" onclick="openEditModal(${w.id})">Edit</button>
          <button class="btn-icon delete-btn" onclick="openDeleteModal(${w.id})">Delete</button>
        </div>
      </div>
    `).join('');

    groupCard.innerHTML = `
      <div class="group-header">
        <h3 class="group-title">${groupType}</h3>
        <span class="group-total">${totalText.join(' | ')}</span>
      </div>
      <div class="sub-wallet-list">
        ${subWalletsHTML}
      </div>
    `;

    container.appendChild(groupCard);
  });
}

const addModal = document.getElementById('add-wallet-modal');
document.getElementById('open-add-modal-btn').onclick = () => addModal.style.display = 'flex';
document.getElementById('close-add-modal-btn').onclick = () => addModal.style.display = 'none';

document.getElementById('add-wallet-form').onsubmit = (e) => {
  e.preventDefault();
  const newWallet = {
    id: Date.now(),
    type: document.getElementById('wallet-type').value,
    name: document.getElementById('wallet-name').value,
    amount: Number(document.getElementById('wallet-amount').value),
    currency: document.getElementById('wallet-currency').value
  };

  wallets.push(newWallet);
  saveWallets();

  document.getElementById('add-wallet-form').reset();
  addModal.style.display = 'none';
};

const editModal = document.getElementById('edit-wallet-modal');

function openEditModal(id) {
  selectedWalletId = id;
  const targetWallet = wallets.find(w => w.id === id);
  if (targetWallet) {
    document.getElementById('edit-wallet-amount').value = targetWallet.amount;
    editModal.style.display = 'flex';
  }
}

document.getElementById('close-edit-modal-btn').onclick = () => editModal.style.display = 'none';

document.getElementById('edit-wallet-form').onsubmit = (e) => {
  e.preventDefault();
  const newAmount = Number(document.getElementById('edit-wallet-amount').value);
  
  wallets = wallets.map(w => w.id === selectedWalletId ? { ...w, amount: newAmount } : w);
  saveWallets();
  editModal.style.display = 'none';
};

const deleteModal = document.getElementById('delete-confirm-modal');

function openDeleteModal(id) {
  selectedWalletId = id;
  deleteModal.style.display = 'flex';
}

document.getElementById('cancel-delete-btn').onclick = () => deleteModal.style.display = 'none';

document.getElementById('confirm-delete-btn').onclick = () => {
  wallets = wallets.filter(w => w.id !== selectedWalletId);
  saveWallets();
  deleteModal.style.display = 'none';
};

window.onclick = (e) => {
  if (e.target === addModal) addModal.style.display = 'none';
  if (e.target === editModal) editModal.style.display = 'none';
  if (e.target === deleteModal) deleteModal.style.display = 'none';
};

renderWallets();