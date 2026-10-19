document.addEventListener("DOMContentLoaded", () => {
  // --- LOCALSTORAGE & MOCK DATA ---
  let goals = JSON.parse(localStorage.getItem("easyMoney_goals")) || [
    {
      id: "1",
      name: "✈️ Japan Trip",
      targetAmount: 30000000,
      currentAmount: 18000000,
      currency: "VND",
      finishDate: "2026-12-31",
      periodType: "month",
      periodSaving: 2000000,
    },
    {
      id: "2",
      name: "💻 MacBook Pro",
      targetAmount: 35000000,
      currentAmount: 35000000,
      currency: "VND",
      finishDate: "2026-06-01",
      periodType: "month",
      periodSaving: 5000000,
    }
  ];

  // --- ELEMENTS ---
  const container = document.getElementById("goal-groups-container");
  const filterStatus = document.getElementById("filter-status");
  const sortBy = document.getElementById("sort-by");

  // Add / Edit Modal Elements
  const addModal = document.getElementById("add-goal-modal");
  const openAddModalBtn = document.getElementById("open-add-modal-btn");
  const closeAddModalBtn = document.getElementById("close-add-modal-btn");
  const addGoalForm = document.getElementById("add-goal-form");

  // Transaction (Deposit/Withdraw) Modal Elements
  const transModal = document.getElementById("transaction-modal");
  const closeTransModalBtn = document.getElementById("close-trans-modal-btn");
  const transForm = document.getElementById("transaction-form");

  // --- HELPER FUNCTIONS ---
  function saveGoals() {
    localStorage.setItem("easyMoney_goals", JSON.stringify(goals));
    renderGoals();
  }

  function formatCurrency(amount, currency) {
    return new Intl.NumberFormat("vi-VN").format(amount) + " " + currency;
  }

  function getDaysRemaining(finishDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finishDate = new Date(finishDateStr);
    const diffTime = finishDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // --- RENDER FUNCTION ---
  function renderGoals() {
    if (!container) return;
    container.innerHTML = "";

    // 1. Lọc (Filter)
    let filtered = goals.filter((g) => {
      const isCompleted = g.currentAmount >= g.targetAmount;
      if (filterStatus && filterStatus.value === "completed") return isCompleted;
      if (filterStatus && filterStatus.value === "in_progress") return !isCompleted;
      return true;
    });

    // 2. Sắp xếp (Sort)
    if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy.value === "deadline") {
          return new Date(a.finishDate) - new Date(b.finishDate);
        }
        if (sortBy.value === "progress") {
          return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
        }
        if (sortBy.value === "target") {
          return b.targetAmount - a.targetAmount;
        }
        return 0;
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">Không tìm thấy mục tiêu nào.</p>`;
      return;
    }

    // 3. Render Goal Cards
    filtered.forEach((goal) => {
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
      const daysLeft = getDaysRemaining(goal.finishDate);

      const card = document.createElement("div");
      card.className = `goal-card ${isCompleted ? "completed" : ""}`;
      card.innerHTML = `
        <div class="goal-card-header">
          <h3 class="goal-title">${goal.name}</h3>
          <span class="goal-status-badge ${isCompleted ? "badge-completed" : "badge-in-progress"}">
            ${isCompleted ? "Completed" : "Ongoing"}
          </span>
        </div>

        <div class="goal-card-body">
          <div class="goal-amounts">
            <span>${formatCurrency(goal.currentAmount, goal.currency)}</span>
            <strong>${percent}%</strong>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percent}%;"></div>
          </div>
          <div class="goal-meta">
            <span>Mục tiêu: ${formatCurrency(goal.targetAmount, goal.currency)}</span>
            <span>${isCompleted ? "Đã đạt" : `${daysLeft} days left`}</span>
          </div>
        </div>

        <div class="goal-actions">
          <button class="btn-deposit" onclick="openTransModal('${goal.id}', 'deposit')">+ Deposit</button>
          <button class="btn-withdraw" onclick="openTransModal('${goal.id}', 'withdraw')">- Withdraw</button>
          <button class="btn-edit" onclick="editGoal('${goal.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteGoal('${goal.id}')">Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- MODAL ADD / EDIT EVENTS ---
  if (openAddModalBtn && addModal) {
    openAddModalBtn.addEventListener("click", () => {
      if (addGoalForm) addGoalForm.reset();
      const goalIdInput = document.getElementById("goal-id");
      if (goalIdInput) goalIdInput.value = "";

      const modalTitle = document.getElementById("modal-title");
      if (modalTitle) modalTitle.innerText = "Add Goal";

      addModal.classList.add("open");
    });
  }

  if (closeAddModalBtn && addModal) {
    closeAddModalBtn.addEventListener("click", () => {
      addModal.classList.remove("open");
    });
  }

  if (addGoalForm) {
    addGoalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("goal-id") ? document.getElementById("goal-id").value : "";
      const name = document.getElementById("goal-name").value;
      const targetAmount = parseFloat(document.getElementById("goal-amount").value);
      const currency = document.getElementById("wallet-currency").value;
      const finishDate = document.getElementById("finish-date").value;
      const periodType = document.getElementById("period-type").value;
      const periodSaving = parseFloat(document.getElementById("period-saving").value) || 0;

      if (id) {
        // Cập nhật mục tiêu (Edit)
        const goal = goals.find((g) => g.id === id);
        if (goal) {
          goal.name = name;
          goal.targetAmount = targetAmount;
          goal.currency = currency;
          goal.finishDate = finishDate;
          goal.periodType = periodType;
          goal.periodSaving = periodSaving;
        }
      } else {
        // Thêm mới mục tiêu (Add)
        goals.push({
          id: Date.now().toString(),
          name: name,
          targetAmount: targetAmount,
          currentAmount: 0,
          currency: currency,
          finishDate: finishDate,
          periodType: periodType,
          periodSaving: periodSaving,
        });
      }

      saveGoals();
      if (addModal) addModal.classList.remove("open");
    });
  }

  // --- GLOBAL FUNCTIONS CHO CÁC NÚT THAO TÁC TRÊN CARD ---
  window.editGoal = function (id) {
    const goal = goals.find((g) => g.id === id);
    if (!goal || !addModal) return;

    const modalTitle = document.getElementById("modal-title");
    if (modalTitle) modalTitle.innerText = "Edit Goal";

    document.getElementById("goal-id").value = goal.id;
    document.getElementById("goal-name").value = goal.name;
    document.getElementById("goal-amount").value = goal.targetAmount;
    document.getElementById("wallet-currency").value = goal.currency;
    document.getElementById("finish-date").value = goal.finishDate;
    document.getElementById("period-type").value = goal.periodType;
    document.getElementById("period-saving").value = goal.periodSaving;

    addModal.classList.add("open");
  };

  window.deleteGoal = function (id) {
    if (confirm("Bạn có chắc chắn muốn xóa mục tiêu này không?")) {
      goals = goals.filter((g) => g.id !== id);
      saveGoals();
    }
  };

  // --- TRANSACTION MODAL (NẠP / RÚT TIỀN) ---
  window.openTransModal = function (id, type) {
    if (!transModal) return;

    document.getElementById("trans-goal-id").value = id;
    document.getElementById("trans-type").value = type;
    document.getElementById("trans-amount").value = "";

    const titleEl = document.getElementById("trans-modal-title");
    const submitBtn = document.getElementById("trans-submit-btn");

    if (type === "deposit") {
      if (titleEl) titleEl.innerText = "Nạp tiền vào mục tiêu";
      if (submitBtn) submitBtn.innerText = "Nạp tiền";
    } else {
      if (titleEl) titleEl.innerText = "Rút tiền khỏi mục tiêu";
      if (submitBtn) submitBtn.innerText = "Rút tiền";
    }

    transModal.classList.add("open");
  };

  if (closeTransModalBtn && transModal) {
    closeTransModalBtn.addEventListener("click", () => {
      transModal.classList.remove("open");
    });
  }

  if (transForm) {
    transForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("trans-goal-id").value;
      const type = document.getElementById("trans-type").value;
      const amount = parseFloat(document.getElementById("trans-amount").value);

      const goal = goals.find((g) => g.id === id);
      if (goal) {
        if (type === "deposit") {
          goal.currentAmount += amount;
        } else if (type === "withdraw") {
          if (amount > goal.currentAmount) {
            alert("Số tiền rút không thể vượt quá số tiền hiện có!");
            return;
          }
          goal.currentAmount -= amount;
        }
        saveGoals();
      }

      if (transModal) transModal.classList.remove("open");
    });
  }

  // --- ĐÓNG MODAL KHI CLICK RA VÙNG NỀN ĐEN ---
  window.addEventListener("click", (e) => {
    if (e.target === addModal) addModal.classList.remove("open");
    if (e.target === transModal) transModal.classList.remove("open");
  });

  // --- FILTER & SORT LISTENERS ---
  if (filterStatus) filterStatus.addEventListener("change", renderGoals);
  if (sortBy) sortBy.addEventListener("change", renderGoals);

  // Khởi chạy lần đầu khi tải trang
  renderGoals();
});