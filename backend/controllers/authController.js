const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
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

    // Поиск пользователя по логину или email
    let user = await User.getByLogin(loginOrEmail);
    if (!user) {
      user = await User.getByEmail(loginOrEmail);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Неверный email/логин или пароль' });
    }

    // Проверка активности
    if (!user.is_active) {
      return res.status(403).json({ message: 'Учетная запись деактивирована' });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    // Генерация токена
    const token = generateToken(user.id);

    res.json({
      accessToken: token,
      userData: {
        id: user.id,
        login: user.login,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.login,
        email: user.email,
        role: 'admin',
        avatar: null,
      },
      userAbilityRules: [
        {
          action: 'manage',
          subject: 'all',
        },
      ],
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
