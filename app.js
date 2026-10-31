let lastMsgId = 0;
let pollingTimer = null;
let myUsername = '';
let isFetching = false;
let isSending = false;

async function api(action, method = 'GET', body = null) {
  const options = { method, headers: {} };
  if (body) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`/api/chat?action=${action}`, options);
  return await res.json();
}

async function register() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (!u || !p) return alert('请填写用户名和密码');

  const res = await api('register', 'POST', { username: u, password: p });
  if (res.error) {
    document.getElementById('auth-msg').innerText = res.error;
  } else {
    alert('注册成功，请登录');
  }
}

async function login() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (!u || !p) return alert('请填写用户名和密码');

  const res = await api('login', 'POST', { username: u, password: p });
  if (res.error) {
    document.getElementById('auth-msg').innerText = res.error;
  } else {
    myUsername = res.username;
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('chat-panel').style.display = 'flex';
    
    document.getElementById('msg-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    startChat();
  }
}

function startChat() {
  fetchMessages();
  setInterval(heartbeat, 60000);

  pollingTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchMessages();
    }
  }, 3000);
}

async function heartbeat() {
  await api('heartbeat', 'POST');
}

function appendMessage(msg) {
  const msgContainer = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message' + (msg.username === myUsername ? ' mine' : '');

  const sender = document.createElement('div');
  sender.className = 'sender';
  sender.innerText = msg.username;

  const content = document.createElement('div');
  content.innerText = msg.text;

  div.appendChild(sender);
  div.appendChild(content);
  msgContainer.appendChild(div);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

async function fetchMessages() {
  if (isFetching) return;
  isFetching = true;
  
  try {
    const res = await api(`getMessages&after=${lastMsgId}`);
    if (res.error) return console.error(res.error);

    if (res.messages && res.messages.length > 0) {
      res.messages.forEach(msg => {
        if (msg.id > lastMsgId) {
          lastMsgId = msg.id;
          appendMessage(msg);
        }
      });
    }
  } finally {
    isFetching = false;
  }
}

async function sendMessage() {
  if (isSending) return;
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  input.value = '';
  
  try {
    const res = await api('sendMessage', 'POST', { text });
    if (res.error) {
      alert(res.error);
      input.value = text;
    } else if (res.message) {
      if (res.message.id > lastMsgId) {
        lastMsgId = res.message.id;
        appendMessage(res.message);
      }
    }
  } finally {
    isSending = false;
  }
}

function logout() {
  document.cookie = 'session=; Max-Age=0; path=/';
  location.reload();
}