const PostMasterMailAccounts = require('../models/postMasterMailAccounts');
const { asyncHandler } = require('../middleware/errorHandler');

const getPostMasterMailAccounts = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 1000;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await PostMasterMailAccounts.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  res.json(result);
});

const getPostMasterMailAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const postMasterMailAccount = await PostMasterMailAccounts.getById(postMasterMailAccountId);

  if (!postMasterMailAccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(postMasterMailAccount);
});

const createPostMasterMailAccount = asyncHandler(async (req, res) => {
  const data = {};
  
  // Обязательные поля
  data.type = req.body.type;
  data.authenticationType = req.body.authenticationType;
  data.login = req.body.login;
  data.host = req.body.host;
  
  // Опциональные поля
  if (req.body.password !== undefined) data.password = req.body.password;
  if (req.body.imapFolder !== undefined) data.imapFolder = req.body.imapFolder;
  if (req.body.trusted !== undefined) data.trusted = req.body.trusted;
  if (req.body.dispatchingBy !== undefined) data.dispatchingBy = req.body.dispatchingBy;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.oauth2TokenConfigID !== undefined) data.oauth2TokenConfigID = req.body.oauth2TokenConfigID;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  // Валидация обязательных полей
  if (!data.type) {
    return res.status(400).json({ message: 'type is required' });
  }
  if (!data.authenticationType) {
    return res.status(400).json({ message: 'authenticationType is required' });
  }
  if (!data.login) {
    return res.status(400).json({ message: 'login is required' });
  }
  if (!data.host) {
    return res.status(400).json({ message: 'host is required' });
  }

  // Для password - требуется если authenticationType = 'password'
  if (data.authenticationType === 'password' && !data.password) {
    return res.status(400).json({ message: 'password is required when authenticationType is password' });
  }

  const newPostMasterMailAccount = await PostMasterMailAccounts.create(data);

  res.status(201).json(newPostMasterMailAccount);
});

const updatePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  
  // Опциональные поля
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.authenticationType !== undefined) data.authenticationType = req.body.authenticationType;
  if (req.body.login !== undefined) data.login = req.body.login;
  if (req.body.password !== undefined) data.password = req.body.password;
  if (req.body.host !== undefined) data.host = req.body.host;
  if (req.body.imapFolder !== undefined) data.imapFolder = req.body.imapFolder;
  if (req.body.trusted !== undefined) data.trusted = req.body.trusted;
  if (req.body.dispatchingBy !== undefined) data.dispatchingBy = req.body.dispatchingBy;
  if (req.body.queueId !== undefined) data.queueId = req.body.queueId;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.oauth2TokenConfigID !== undefined) data.oauth2TokenConfigID = req.body.oauth2TokenConfigID;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

  const updatedPostMasterMailAccount = await PostMasterMailAccounts.update(postMasterMailAccountId, data);

  if (!updatedPostMasterMailAccount) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.json(updatedPostMasterMailAccount);
});

const deletePostMasterMailAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);

  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await PostMasterMailAccounts.delete(postMasterMailAccountId);

  if (!deleted) {
    return res.status(404).json({ message: 'PostMasterMailAccount not found' });
  }

  res.status(204).send();
});

const net = require('net');
const tls = require('tls');

// Helper: attempt IMAP connection and optional LOGIN
async function imapTestConnection({ host, port = 993, username, password, useTLS = true, timeout = 10000 }) {
  return new Promise((resolve) => {
    const onError = (err) => {
      try { socket.destroy(); } catch (e) {}
      resolve({ success: false, message: err.message || String(err) });
    }

    let socket;
    let finished = false
    const handleSuccess = (msg) => {
      if (finished) return
      finished = true
      try { socket.end(); } catch (e) {}
      resolve({ success: true, message: msg || 'OK' })
    }

    const cleanup = () => {
      if (socket) {
        socket.removeAllListeners();
        try { socket.destroy(); } catch (e) {}
      }
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, message: 'Timeout' });
    }, timeout);

    const onData = (data) => {
      const text = data.toString();
      // Received server greeting or response
      if (/^\* OK/i.test(text)) {
        if (username && password) {
          // Send LOGIN command
          try {
            socket.write(`A001 LOGIN "${username.replace(/"/g, '')}" "${password.replace(/"/g, '')}"\r\n`);
          } catch (e) {
            clearTimeout(timer);
            cleanup();
            resolve({ success: false, message: 'Failed to send LOGIN' });
          }
        } else {
          clearTimeout(timer);
          cleanup();
          handleSuccess('Connected');
        }
      } else if (/A001 OK/i.test(text)) {
        clearTimeout(timer);
        cleanup();
        handleSuccess('Authenticated');
      } else if (/A001 NO|A001 BAD|LOGIN failed|Authentication failed/i.test(text)) {
        clearTimeout(timer);
        cleanup();
        resolve({ success: false, message: text.trim() });
      }
    }

    try {
      if (useTLS) {
        socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {
          // connected
        });
      } else {
        socket = net.connect(port, host, () => {
          // connected
        });
      }

      socket.setEncoding('utf8');
      socket.once('data', onData);
      // further data in case LOGIN response arrives later
      socket.on('data', onData);
      socket.on('error', (err) => {
        clearTimeout(timer);
        cleanup();
        resolve({ success: false, message: err.message || String(err) });
      });
      socket.on('end', () => {
        clearTimeout(timer);
        cleanup();
      });
    } catch (err) {
      clearTimeout(timer);
      cleanup();
      resolve({ success: false, message: err.message || String(err) });
    }
  });
}

const testConnection = asyncHandler(async (req, res) => {
  try {
    let { host, port, protocol, username, password, type } = req.body || {}

    // Нормализация
    host = host?.toString().trim() || ''
    username = username?.toString().trim().replace(/,/g, '.') || ''
    password = password?.toString().trim() || ''

    // Валидация
    if (!host) return res.status(400).json({ success: false, message: 'Хост обязателен' })
    if (!username) return res.status(400).json({ success: false, message: 'Логин обязателен' })
    if (!username.includes('@')) return res.status(400).json({ success: false, message: 'Неверный формат email' })
    if (!password) return res.status(400).json({ success: false, message: 'Пароль обязателен' })

    const portNum = port ? parseInt(String(port), 10) : (protocol === 'imap' || protocol === 'imapssl' ? 993 : 143)
    const useTLS = portNum === 993

    const result = await imapTestConnection({ host, port: portNum, username, password, useTLS })
    if (result.success) {
      res.json({ success: true, message: result.message })
    } else {
      res.status(400).json({ success: false, message: result.message })
    }
  } catch (err) {
    console.error('Error in testConnection:', err)
    res.status(500).json({ success: false, message: (err && err.message) ? err.message : 'Internal error' })
  }
})

const testConnectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const postMasterMailAccountId = parseInt(id, 10);
  if (isNaN(postMasterMailAccountId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const account = await PostMasterMailAccounts.getById(postMasterMailAccountId);
  if (!account) return res.status(404).json({ success: false, message: 'PostMasterMailAccount not found' });

  const host = account.host;
  const username = account.login;
  const password = account.password;
  let port = 993;
  if (account.type && typeof account.type === 'string') {
    const t = account.type.toLowerCase();
    if (t.includes('s')) port = 993; else port = 143;
  }
  const useTLS = port === 993;

  const result = await imapTestConnection({ host, port, username, password, useTLS });
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

module.exports = {
  getPostMasterMailAccounts,
  getPostMasterMailAccountById,
  createPostMasterMailAccount,
  updatePostMasterMailAccount,
  deletePostMasterMailAccount,
  testConnection,
  testConnectionById,
};
