function handlePurchase(packageNumber) {
  if (!currentUser) {
    alert('Vui lòng đăng nhập hoặc đăng ký để mua hàng!');
    return;
  }

  const prices = {
      1: '30.000',
      2: '50.000', 
      3: '80.000',
      4: '140.000',
      5: '170.000',
      6: '200.000',
      7: '260.000',
      8: '100.000',
  };

  const packageName = `Gói ${packageNumber}`;
  const price = prices[packageNumber];

  // Tạo form HTML
  const formHTML = `
      <div id="purchaseForm" class="form-container">
          <button class="close-btn" onclick="closeForm()">×</button>
          <h2>Thông tin đặt hàng</h2>
          <form id="orderForm">
              <select name="deviceType" required>
                  <option value="">Chọn loại thiết bị</option>
                  <option value="iphone">iPhone</option>
                  <option value="ipad">iPad</option>
              </select>
              <input type="text" name="udid" placeholder="UDID thiết bị" required>
              <input type="text" name="bankAccount" placeholder="Số tài khoản ngân hàng" required>
              <input type="text" name="bankName" placeholder="Tên ngân hàng" required>
              <input type="text" name="accountName" placeholder="Tên chủ tài khoản" required>
              <input type="text" name="facebookUrl" placeholder="Link Facebook của bạn" required>
              <input type="text" name="username" placeholder="Username Telegram (nếu có)">
              <input type="text" name="zaloPhone" placeholder="Số điện thoại Zalo (nếu có)">
              <input type="text" name="amount" value="${price}" readonly>
              <button type="submit">Xác nhận</button>
          </form>
      </div>
  `;

  // Thêm form vào trang
  document.body.insertAdjacentHTML('beforeend', formHTML);

  // Xử lý submit form
  document.getElementById('orderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
          packageName,
          deviceType: formData.get('deviceType'),
          udid: formData.get('udid'),
          bankAccount: formData.get('bankAccount'),
          bankName: formData.get('bankName'),
          accountName: formData.get('accountName'),
          facebookUrl: formData.get('facebookUrl'),
          username: formData.get('username'),
          amount: formData.get('amount')
      };

      // Gửi thông tin đến Telegram bot
      const BOT_TOKEN = '7999731523:AAGXfm0_T3QEAnZnuxJDx-UUnTw8kI3b6Qg';
      const CHAT_ID = '6956722046';
      const message = `
🛒 Đơn hàng mới:
📦 ${data.packageName}
📱 Thiết bị: ${data.deviceType}
🔑 UDID: ${data.udid}
🏦 STK: ${data.bankAccount}
🏛️ Ngân hàng: ${data.bankName}
👤 Chủ TK: ${data.accountName}
📱 Facebook: ${data.facebookUrl}
💬 Telegram: ${data.username || 'Không có'}
📞 Zalo: ${data.zaloPhone || 'Không có'}
💰 Số tiền: ${data.amount}₫
      `;

      try {
          const orderId = Date.now().toString();
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  chat_id: CHAT_ID,
                  text: message,
                  parse_mode: 'HTML',
                  reply_markup: JSON.stringify({
                      inline_keyboard: [[
                          { text: "Duyệt đơn", callback_data: `approve_${orderId}` }
                      ]]
                  })
              })
          });

          // Thêm đơn hàng với trạng thái ban đầu là "Đang chờ duyệt"
          if (currentUser) {
              const order = {
                  id: orderId,
                  packageName,
                  deviceType: data.deviceType,
                  udid: data.udid,
                  amount: data.amount,
                  date: new Date().toLocaleString(),
                  status: 'Đang chờ duyệt'
              };
              if (!currentUser.orders) currentUser.orders = [];
              currentUser.orders.push(order);
              const userIndex = users.findIndex(u => u.username === currentUser.username);
              users[userIndex] = currentUser;
              localStorage.setItem('users', JSON.stringify(users));
          }

          // Webhook handler cho Telegram callback
          const handleTelegramCallback = async (callback_data) => {
              if (callback_data.startsWith('approve_')) {
                  const orderId = callback_data.split('_')[1];
                  const userIndex = users.findIndex(u => u.orders.some(order => order.id === orderId));
                  if (userIndex !== -1) {
                      const orderIndex = users[userIndex].orders.findIndex(order => order.id === orderId);
                      users[userIndex].orders[orderIndex].status = 'Đã duyệt - Vui lòng chờ đợi';
                      localStorage.setItem('users', JSON.stringify(users));
                      if (currentUser && currentUser.username === users[userIndex].username) {
                          currentUser = users[userIndex];
                      }
                      // Gửi thông báo phản hồi đến Telegram
                      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                              chat_id: CHAT_ID,
                              text: `✅ Đơn hàng #${orderId} đã được duyệt thành công!`,
                          })
                      });
                  }
              }
          };

          // Đã di chuyển logic tạo đơn hàng lên trên

          // Hiển thị form thanh toán QR
          const qrPaymentHTML = `
              <div id="qrPaymentForm" class="form-container qr-payment">
                  <button class="close-btn" onclick="closeQRForm()">×</button>
                  <h2>Thông tin thanh toán</h2>
                  <div class="bank-info">
                      <p><strong>Ngân hàng:</strong> MB Bank</p>
                      <p><strong>Số tài khoản:</strong> 0374249125</p>
                      <p><strong>Chủ tài khoản:</strong> CAO NHAT MINH</p>
                      <p><strong>Số tiền:</strong> ${data.amount}₫</p>
                  </div>
                  <div class="qr-code">
                      <img src="https://api.vietqr.io/image/970422-0374249125-skbJ230.jpg?accountName=CAO%20NHAT%20MINH&amount=${data.amount.replace(/\D/g, '')}" alt="QR Code">
                  </div>
                  <p class="note">Quét mã QR để thanh toán</p>
              </div>
          `;
          document.body.insertAdjacentHTML('beforeend', qrPaymentHTML);
          closeForm(); // Đóng form thông tin
      } catch (error) {
          console.error('Error:', error);
          alert('Có lỗi xảy ra, vui lòng thử lại sau!');
      }
  });
}

function closeForm() {
    const form = document.getElementById('purchaseForm');
    if (form) {
        form.remove();
    }
}


function closeQRForm() {
    const form = document.getElementById('qrPaymentForm');
    if (form) {
        form.remove();
    }
}

let users = JSON.parse(localStorage.getItem('users') || '[]');
let currentUser = null;

function showLoginForm() {
    const formHTML = `
        <div id="loginForm" class="auth-form">
            <h2>Đăng nhập</h2>
            <input type="text" id="loginUsername" placeholder="Tên đăng nhập">
            <input type="password" id="loginPassword" placeholder="Mật khẩu">
            <div id="loginError" class="error-message"></div>
            <button onclick="login()">Đăng nhập</button>
            <button onclick="closeAuthForm('loginForm')">Đóng</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function showRegisterForm() {
    const formHTML = `
        <div id="registerForm" class="auth-form">
            <h2>Đăng ký</h2>
            <input type="text" id="fullName" placeholder="Tên đầy đủ">
            <input type="text" id="regUsername" placeholder="Tên đăng nhập">
            <input type="password" id="regPassword" placeholder="Mật khẩu">
            <input type="password" id="confirmPassword" placeholder="Nhập lại mật khẩu">
            <div id="registerError" class="error-message"></div>
            <button onclick="register()">Tạo tài khoản</button>
            <button onclick="closeAuthForm('registerForm')">Đóng</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function closeAuthForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.remove();
    }
}

function register() {
    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerError');

    if (!fullName || !username || !password || !confirmPassword) {
        errorDiv.textContent = 'Vui lòng điền đầy đủ thông tin';
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Mật khẩu không khớp';
        return;
    }

    if (users.some(u => u.username === username)) {
        errorDiv.textContent = 'Tên đăng nhập đã tồn tại';
        return;
    }

    const newUser = { fullName, username, password, orders: [] };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    updateAuthDisplay();
    alert('Đăng ký thành công!');
    closeAuthForm('registerForm');
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        errorDiv.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng';
        return;
    }

    currentUser = user;
    if (!currentUser.orders) {
        currentUser.orders = [];
    }
    updateAuthDisplay();
    alert(`Chào mừng ${user.fullName}!`);
    closeAuthForm('loginForm');
}

function logout() {
    currentUser = null;
    updateAuthDisplay();
}

function updateAuthDisplay() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');

    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'inline-block';
    } else {
        authButtons.style.display = 'inline-block';
        userProfile.style.display = 'none';
    }
}

function showUserProfile() {
    const profileHTML = `
        <div class="profile-container">
            <button class="close-btn" onclick="closeProfile()">×</button>
            <div class="profile-header">
                <h2>Hồ sơ người dùng</h2>
                <p>Tên đầy đủ: ${currentUser.fullName}</p>
                <p>Tên đăng nhập: ${currentUser.username}</p>
            </div>
            <div class="order-history">
                <div class="order-header">
                    <h3>Lịch sử đơn hàng</h3>
                    <button onclick="reloadOrders()" class="reload-btn">Tải lại đơn hàng</button>
                </div>
                ${currentUser.orders.length === 0 ? 
                    '<p>Chưa có đơn hàng nào</p>' : 
                    currentUser.orders.map(order => `
                        <div class="order-item">
                            <p><strong>Gói:</strong> ${order.packageName}</p>
                            <p><strong>Thiết bị:</strong> ${order.deviceType}</p>
                            <p><strong>UDID:</strong> ${order.udid}</p>
                            <p><strong>Số tiền:</strong> ${order.amount}₫</p>
                            <p><strong>Thời gian:</strong> ${order.date}</p>
                            <p><strong>Trạng thái:</strong> <span class="order-status">${order.status || 'Đang kiểm tra'}</span></p>
                        </div>
                    `).join('')}
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', profileHTML);
}

function closeProfile() {
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.remove();
    }
}

function reloadOrders() {
    closeProfile();
    showUserProfile();
}