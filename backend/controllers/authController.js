const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Agents = require('../models/agents');
const { getAgentPermissions } = require('../middleware/permissions');

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' },
  );
};

// Маппинг разрешений на CASL правила.
// Единая модель: разрешения имеют вид menu_<раздел>_<read|write|delete>.
// Для каждого активного разрешения генерируется правило с subject = 'menu_<раздел>'
// и action = read|write|delete. Это используется фронтом для показа пунктов меню
// и доступности кнопок создания/редактирования/удаления.
//
// Разрешения, не соответствующие шаблону menu_*_<read|write|delete> (legacy:
// super_user, manage_roles, system_settings, kb_*, see_*_tickets и т.п.), молча
// игнорируются с предупреждением в лог. Это переходный период; рекомендуется
// очистить БД миграцией.
const mapPermissionsToAbilityRules = (permissions) => {
  const rules = [];
  const legacy = [];

  Object.entries(permissions)
    .filter(([, value]) => value === true)
    .forEach(([permission]) => {
      const match = permission.match(/^(.*)_(read|write|delete)$/);
      if (!match) {
        legacy.push(permission);
        return;
      }
      const subject = match[1];
      const op = match[2];
      // action имена совпадают с типом операции (read/write/delete) — это согласовано
      // с фронтовым useUserPermissions, который различает операции по action.
      rules.push({ action: op, subject });
    });

  if (legacy.length > 0) {
    console.warn(
      `[auth] Ignored ${legacy.length} legacy permission(s) not matching menu_*_<read|write|delete>:`,
      legacy.join(', ')
    );
  }

  return rules;
};

// Регистрация нового пользователя
const register = async (req, res) => {
  try {
    const { login, password, firstName, lastName, email } = req.body;

    // Валидация
    if (!login || !password) {
      return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }

    // Проверка существования пользователя
    const existingUser = await User.getByLogin(login);
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
    }

    if (email) {
      const existingEmail = await User.getByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await User.create({
      login,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      isActive: true,
    });

    // Генерация токена
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        login: user.login,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

// Вход пользователя
const login = async (req, res) => {
  try {
    const { login, email, password } = req.body;

    // Валидация
    const loginOrEmail = login || email;
    if (!loginOrEmail || !password) {
      return res.status(400).json({ message: 'Email/логин и пароль обязательны' });
    }

    // Сначала ищем в agents
    let agentResult = await Agents.getAll({ q: loginOrEmail });
    let agent = null;
    if (agentResult.agents && agentResult.agents.length > 0) {
      agent = agentResult.agents.find(a => a.email === loginOrEmail || a.login === loginOrEmail);
    }

    let user = null;
    if (!agent) {
      // Если не найден в agents, ищем в users
      user = await User.getByLogin(loginOrEmail);
      if (!user) {
        user = await User.getByEmail(loginOrEmail);
      }
    }

    let isAgent = !!agent;

    if (!user && !agent) {
      return res.status(401).json({ message: 'Неверный email/логин или пароль' });
    }

    let entity = user || agent;
    let isActive = user ? user.is_active : agent.isActive;
    let passwordHash = user ? user.password : agent.password;

    console.log('Login attempt:', { loginOrEmail, user: !!user, agent: !!agent, isActive, id: entity.id });

    // Проверка активности
    if (!isActive) {
      return res.status(403).json({ message: 'Доступ ограничен, ваша учетная запись не активна' });
    }

    // Проверка пароля
    let isPasswordValid;
    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
      isPasswordValid = await bcrypt.compare(password, passwordHash);
    } else {
      isPasswordValid = password === passwordHash;
    }
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    // Генерация токена
    const token = generateToken(entity.id);

    // Получение разрешений для агента
    let userAbilityRules = [];
    if (isAgent) {
      const permissions = await getAgentPermissions(entity.id);
      // Преобразуем разрешения в CASL правила
      userAbilityRules = mapPermissionsToAbilityRules(permissions);
    } else {
      // Для обычных пользователей (не агентов) — минимальные права (свой профиль)
      userAbilityRules = [
        { action: 'read', subject: 'own_profile' },
      ];
    }

    res.json({
      accessToken: token,
      userData: {
        id: entity.id,
        login: entity.login || entity.email,
        fullName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.login : `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.login,
        email: entity.email,
        role: 'admin',
        avatar: isAgent ? agent.avatar : null,
        type: isAgent ? 'agent' : 'user',
      },
      userAbilityRules,
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};

// Получение текущего пользователя
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.getById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({
      id: user.id,
      login: user.login,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      isActive: user.is_active,
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Обновление профиля
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    const updatedUser = await User.update(req.userId, {
      firstName,
      lastName,
      email,
    });

    res.json({
      message: 'Профиль обновлен',
      user: {
        id: updatedUser.id,
        login: updatedUser.login,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Изменение пароля
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Текущий и новый пароль обязательны' });
    }

    const user = await User.getById(req.userId);
    
    // Проверка текущего пароля
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный текущий пароль' });
    }

    // Хеширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.update(req.userId, { password: hashedPassword });

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Ошибка изменения пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
};
