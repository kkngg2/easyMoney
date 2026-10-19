document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Selectors
    const authView = document.getElementById('auth-view');
    const profileView = document.getElementById('profile-view');
    const authTabs = document.getElementById('auth-tabs');

    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-form');
    const resetForm = document.getElementById('reset-form');

    const showForgotBtn = document.getElementById('show-forgot-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');

    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUpload = document.getElementById('avatar-upload');

    const currencySelect = document.getElementById('currency-select');
    const monthlyBudgetInput = document.getElementById('monthly-budget');
    const preferencesForm = document.getElementById('preferences-form');

    const logoutBtn = document.getElementById('logout-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    let resetTargetEmail = ''; // Lưu tạm email cần đổi pass

    // 2. Chuyển đổi giữa các Sub-Form
    function hideAllAuthForms() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        forgotForm.classList.add('hidden');
        resetForm.classList.add('hidden');
    }

    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        authTabs.classList.remove('hidden');
        hideAllAuthForms();
        loginForm.classList.remove('hidden');
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        authTabs.classList.remove('hidden');
        hideAllAuthForms();
        registerForm.classList.remove('hidden');
    });

    showForgotBtn.addEventListener('click', () => {
        authTabs.classList.add('hidden');
        hideAllAuthForms();
        forgotForm.classList.remove('hidden');
    });

    backToLoginBtn.addEventListener('click', () => {
        tabLoginBtn.click();
    });

    cancelResetBtn.addEventListener('click', () => {
        tabLoginBtn.click();
    });

    // 3. Kiểm tra trạng thái đăng nhập
    checkAuthStatus();

    function checkAuthStatus() {
        const activeUser = JSON.parse(localStorage.getItem('easyMoney_activeUser'));

        if (activeUser && activeUser.email) {
            showProfileView(activeUser.email);
        } else {
            showAuthView();
        }
    }

    function showAuthView() {
        authView.classList.remove('hidden');
        profileView.classList.add('hidden');
        tabLoginBtn.click();
    }

    function showProfileView(email) {
        authView.classList.add('hidden');
        profileView.classList.remove('hidden');

        const usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];
        const user = usersDB.find(u => u.email === email);

        if (user) {
            displayName.textContent = user.fullName;
            displayEmail.textContent = user.email;

            avatarPreview.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=BEC970&color=1c2628&size=128`;

            const prefs = user.preferences || { currency: 'VND', monthlyBudget: 15000000 };
            currencySelect.value = prefs.currency;
            monthlyBudgetInput.value = prefs.monthlyBudget;
        }
    }

    // 4. Xử lý Đăng ký
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fullName = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;

        let usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];

        if (usersDB.some(u => u.email === email)) {
            alert('This email is already registered!');
            return;
        }

        const newUser = {
            fullName,
            email,
            password,
            avatar: '',
            preferences: { currency: 'VND', monthlyBudget: 15000000 }
        };

        usersDB.push(newUser);
        localStorage.setItem('easyMoney_users_db', JSON.stringify(usersDB));
        localStorage.setItem('easyMoney_activeUser', JSON.stringify({ email }));

        showToast('Account created successfully!');
        checkAuthStatus();
    });

    // 5. Xử lý Đăng nhập
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];
        const user = usersDB.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('easyMoney_activeUser', JSON.stringify({ email }));
            showToast('Logged in successfully!');
            checkAuthStatus();
        } else {
            alert('Invalid email or password.');
        }
    });

    // 6. Xử lý Quên mật khẩu - Gửi mã xác nhận (Có hiệu lực 1 giờ)
    forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('forgot-email').value.trim().toLowerCase();
        let usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];

        const userIndex = usersDB.findIndex(u => u.email === email);
        if (userIndex === -1) {
            alert('No account found with this email address.');
            return;
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Thời gian hết hạn: 1 giờ kể từ thời điểm tạo (1 * 60 * 60 * 1000 ms)
        const expiresAt = Date.now() + 3600000;

        usersDB[userIndex].resetToken = {
            code: otpCode,
            expiresAt: expiresAt
        };

        localStorage.setItem('easyMoney_users_db', JSON.stringify(usersDB));
        resetTargetEmail = email;

        // Mô phỏng việc gửi email (Hiện thông báo chứa OTP)
        alert(`[EASYMONEY - EMAIL SIMULATION]\n\nYour verification code is: ${otpCode}\n(This code is valid for 1 hour).`);

        hideAllAuthForms();
        resetForm.classList.remove('hidden');
    });

    // 7. Xử lý Đổi Mật khẩu Mới với Mã OTP
    resetForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputCode = document.getElementById('reset-code').value.trim();
        const newPassword = document.getElementById('reset-new-password').value;

        let usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];
        const userIndex = usersDB.findIndex(u => u.email === resetTargetEmail);

        if (userIndex === -1) {
            alert('An error occurred. Please try again.');
            tabLoginBtn.click();
            return;
        }

        const user = usersDB[userIndex];

        if (!user.resetToken || user.resetToken.code !== inputCode) {
            alert('Invalid verification code!');
            return;
        }

        // Kiểm tra mã OTP còn hiệu lực trong vòng 1 giờ hay không
        if (Date.now() > user.resetToken.expiresAt) {
            alert('Verification code has expired (valid for 1 hour). Please request a new code.');
            return;
        }

        // Cập nhật mật khẩu mới & Xóa token
        usersDB[userIndex].password = newPassword;
        delete usersDB[userIndex].resetToken;

        localStorage.setItem('easyMoney_users_db', JSON.stringify(usersDB));

        showToast('Password updated successfully! Please log in.');
        tabLoginBtn.click();
    });

    // 8. Đăng xuất
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('easyMoney_activeUser');
        checkAuthStatus();
        showToast('Logged out!');
    });

    // 9. Cập nhật Preferences
    preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeUser = JSON.parse(localStorage.getItem('easyMoney_activeUser'));
        if (!activeUser) return;

        let usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];
        let user = usersDB.find(u => u.email === activeUser.email);

        if (user) {
            user.preferences = {
                currency: currencySelect.value,
                monthlyBudget: parseFloat(monthlyBudgetInput.value) || 0
            };
            localStorage.setItem('easyMoney_users_db', JSON.stringify(usersDB));
            showToast('Preferences saved!');
        }
    });

    // 10. Cập nhật Avatar
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                const base64 = evt.target.result;
                avatarPreview.src = base64;

                const activeUser = JSON.parse(localStorage.getItem('easyMoney_activeUser'));
                let usersDB = JSON.parse(localStorage.getItem('easyMoney_users_db')) || [];
                let user = usersDB.find(u => u.email === activeUser.email);

                if (user) {
                    user.avatar = base64;
                    localStorage.setItem('easyMoney_users_db', JSON.stringify(usersDB));
                    showToast('Avatar updated!');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
});