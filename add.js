document.addEventListener("DOMContentLoaded", () => {
  // 1. DATA INITIALIZATION (Dùng 'transactions' để đồng bộ với trang Spending Limit)
  let wallets = JSON.parse(localStorage.getItem('my_wallets')) || [
    { id: 1, type: '💰 Cash', name: 'Dining', amount: 2000000, currency: 'VNĐ' },
    { id: 2, type: '💳 E-Wallet', name: 'MoMo', amount: 1500000, currency: 'VNĐ' },
    { id: 3, type: '🏦 Bank Account', name: 'Vietcombank', amount: 12000000, currency: 'VNĐ' }
  ];
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  let chartVND = null, chartUSD = null, activeTab = "all", deleteTargetId = null, editTargetId = null;

  const todayStr = new Date().toISOString().split("T")[0];
  ["income-date", "expense-date"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = todayStr;
  });

  const saveWallets = () => localStorage.setItem('my_wallets', JSON.stringify(wallets));
  const saveTransactions = () => localStorage.setItem('transactions', JSON.stringify(transactions));
  const formatMoney = (amount, currency) => new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;

  // 2. WALLET DROPDOWNS & AUTO SYNC CURRENCY
  function populateWalletDropdowns() {
    const incSel = document.getElementById("income-wallet-type");
    const expSel = document.getElementById("expense-wallet-type");
    if (!incSel || !expSel) return;

    wallets = JSON.parse(localStorage.getItem('my_wallets')) || wallets;
    const groups = {};
    wallets.forEach(w => {
      const g = w.type || "Other Wallets";
      (groups[g] = groups[g] || []).push(w);
    });

    let html = Object.entries(groups).map(([gName, list]) => 
      `<optgroup label="${gName}">${list.map(w => `<option value="${w.id}">${w.name} (${formatMoney(w.amount, w.currency)})</option>`).join('')}</optgroup>`
    ).join('');

    incSel.innerHTML = expSel.innerHTML = html || `<option value="">No Wallets Available</option>`;
    syncCurrency('income');
    syncCurrency('expense');
  }

  function syncCurrency(type) {
    const wSel = document.getElementById(`${type}-wallet-type`);
    const cSel = document.getElementById(`${type}-currency`);
    if (!wSel || !cSel) return;
    const selected = wallets.find(w => w.id === Number(wSel.value));
    if (selected) { cSel.value = selected.currency; cSel.disabled = true; }
  }

  ["income", "expense"].forEach(type => {
    document.getElementById(`${type}-wallet-type`)?.addEventListener("change", () => syncCurrency(type));
  });

  // 3. MODAL CONTROLS
  const modals = {
    income: document.getElementById("add-income-modal"),
    expense: document.getElementById("add-expense-modal"),
    edit: document.getElementById("edit-transaction-modal"),
    delete: document.getElementById("delete-confirm-modal")
  };

  const toggleModal = (modal, show) => { if (modal) modal.style.display = show ? "flex" : "none"; };

  document.getElementById("open-income-modal-btn").onclick = () => { populateWalletDropdowns(); toggleModal(modals.income, true); };
  document.getElementById("open-expense-modal-btn").onclick = () => { populateWalletDropdowns(); toggleModal(modals.expense, true); };
  document.querySelectorAll(".close-modal-btn").forEach(btn => btn.onclick = () => Object.values(modals).forEach(m => toggleModal(m, false)));
  
  document.getElementById("cancel-delete-btn")?.addEventListener("click", () => { toggleModal(modals.delete, false); deleteTargetId = null; });
  window.onclick = (e) => Object.values(modals).forEach(m => { if (e.target === m) toggleModal(m, false); });

  // 4. COMMON HANDLER FOR ADD TRANSACTION
  function handleAddTransaction(type, formId, amountId, categoryVal, walletIdSelect, currencyId, dateId, modalObj) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.onsubmit = (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById(amountId).value);
      const walletId = Number(document.getElementById(walletIdSelect).value);
      const currency = document.getElementById(currencyId).value;
      const date = document.getElementById(dateId).value;
      const targetWallet = wallets.find(w => w.id === walletId);

      if (!targetWallet) return alert("Please select a valid wallet!");
      if (targetWallet.currency !== currency) return alert("Not the same currency!");

      targetWallet.amount += (type === "income" ? amount : -amount);
      saveWallets();

      transactions.push({
        id: Date.now(),
        type,
        category: categoryVal || document.getElementById("expense-category")?.value,
        amount,
        walletId: targetWallet.id,
        walletName: targetWallet.name,
        currency: targetWallet.currency,
        date
      });

      saveTransactions();
      saveAndRefresh();
      toggleModal(modalObj, false);
      form.reset();
      document.getElementById(dateId).value = todayStr;
    };
  }

  handleAddTransaction("income", "add-income-form", "income-amount", "Income", "income-wallet-type", "income-currency", "income-date", modals.income);
  handleAddTransaction("expense", "add-expense-form", "expense-amount", null, "expense-wallet-type", "expense-currency", "expense-date", modals.expense);

  // 5. EDIT & DELETE
  window.openEditModal = (txId) => {
    const tx = transactions.find(t => t.id == txId);
    if (!tx) return;
    editTargetId = txId;
    const amountInput = document.getElementById("edit-transaction-amount");
    if (amountInput) amountInput.value = tx.amount;
    toggleModal(modals.edit, true);
  };

  document.getElementById("edit-transaction-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!editTargetId) return;
    const tx = transactions.find(t => t.id == editTargetId);
    const newAmount = Number(document.getElementById("edit-transaction-amount").value);
    const targetWallet = wallets.find(w => w.id == tx?.walletId);

    if (tx && targetWallet) {
      targetWallet.amount += (tx.type === "income" ? -tx.amount + newAmount : tx.amount - newAmount);
      tx.amount = newAmount;
      saveWallets();
      saveTransactions();
      saveAndRefresh();
    }
    toggleModal(modals.edit, false);
    editTargetId = null;
  });

  window.confirmDelete = (txId) => { deleteTargetId = txId; toggleModal(modals.delete, true); };

  document.getElementById("confirm-delete-btn")?.addEventListener("click", () => {
    if (!deleteTargetId) return;
    const idx = transactions.findIndex(t => t.id == deleteTargetId);
    if (idx !== -1) {
      const tx = transactions[idx];
      const targetWallet = wallets.find(w => w.id == tx.walletId);
      if (targetWallet) {
        targetWallet.amount += (tx.type === "income" ? -tx.amount : tx.amount);
        saveWallets();
      }
      transactions.splice(idx, 1);
      saveTransactions();
      saveAndRefresh();
    }
    toggleModal(modals.delete, false);
    deleteTargetId = null;
  });

  // 6. TABS & FILTER
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      activeTab = e.target.getAttribute("data-tab");
      renderAll();
    };
  });

  // 7. RENDER SUMMARY, TABLE & CHARTS
  function renderAll() {
    const selectedMonth = document.getElementById("filter-month")?.value || "all";
    const selectedYear = document.getElementById("filter-year")?.value || "2026";
    const selectedDate = document.getElementById("filter-date")?.value || "";

    const filteredTx = transactions.filter(tx => {
      if (!tx.date) return false;
      if (selectedDate && tx.date !== selectedDate) return false;
      const d = new Date(tx.date);
      return d.getFullYear().toString() === selectedYear && 
             (selectedMonth === "all" || (d.getMonth() + 1).toString() === selectedMonth);
    });

    let incVND = 0, incUSD = 0, expVND = 0, expUSD = 0;
    const catVND = {}, catUSD = {};

    filteredTx.forEach(tx => {
      const amt = Number(tx.amount);
      const isUSD = (tx.currency || 'VNĐ') === 'USD';

      if (tx.type === "income") {
        isUSD ? (incUSD += amt) : (incVND += amt);
      } else {
        if (isUSD) { expUSD += amt; catUSD[tx.category] = (catUSD[tx.category] || 0) + amt; }
        else { expVND += amt; catVND[tx.category] = (catVND[tx.category] || 0) + amt; }
      }
    });

    const formatSplit = (v, u) => [v !== 0 || u === 0 ? formatMoney(v, 'VNĐ') : null, u !== 0 ? formatMoney(u, 'USD') : null].filter(Boolean).join(' | ');

    if (document.getElementById("total-income-val")) document.getElementById("total-income-val").innerText = formatSplit(incVND, incUSD);
    if (document.getElementById("total-expense-val")) document.getElementById("total-expense-val").innerText = formatSplit(expVND, expUSD);
    if (document.getElementById("net-balance-val")) document.getElementById("net-balance-val").innerText = formatSplit(incVND - expVND, incUSD - expUSD);

    renderCharts(catVND, catUSD);

    const tableBody = document.getElementById("history-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const tabFiltered = filteredTx.filter(tx => activeTab === "all" || tx.type === activeTab)
                                  .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (tabFiltered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">No transactions found</td></tr>`;
      return;
    }

    tabFiltered.forEach(tx => {
      const isInc = tx.type === "income";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${tx.date}</td>
        <td><strong style="color: ${isInc ? '#58cc02' : '#ff4b4b'}">${tx.type.toUpperCase()}</strong></td>
        <td>${tx.category}</td>
        <td>${tx.walletName}</td>
        <td style="font-weight: bold; color: ${isInc ? '#58cc02' : '#ff4b4b'}">${isInc ? '+' : '-'}${formatMoney(tx.amount, tx.currency || 'VNĐ')}</td>
        <td>
          <button onclick="openEditModal('${tx.id}')" class="btn-icon edit-btn">Edit</button>
          <button onclick="confirmDelete('${tx.id}')" class="btn-icon delete-btn">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderCharts(catVND, catUSD) {
    if (typeof Chart === 'undefined') return;
    const colors = ['#ff4b4b', '#1cb0f6', '#ffc800', '#20e453', '#ce82ff', '#ff9600'];

    const createChart = (canvasId, chartRef, catData) => {
      const ctx = document.getElementById(canvasId)?.getContext("2d");
      if (!ctx) return chartRef;
      if (chartRef) chartRef.destroy();
      const labels = Object.keys(catData);
      return labels.length ? new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: Object.values(catData), backgroundColor: colors }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      }) : null;
    };

    chartVND = createChart("expenseChartVND", chartVND, catVND);
    chartUSD = createChart("expenseChartUSD", chartUSD, catUSD);
  }

  document.getElementById("apply-filter-btn")?.addEventListener("click", renderAll);
  document.getElementById("clear-date-btn")?.addEventListener("click", () => {
    const dateInp = document.getElementById("filter-date");
    if (dateInp) dateInp.value = "";
    renderAll();
  });

  function saveAndRefresh() {
    populateWalletDropdowns();
    renderAll();
  }

  populateWalletDropdowns();
  renderAll();
});