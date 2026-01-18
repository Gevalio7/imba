const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock authentication for demo
    let userData = null;
    let userAbilityRules = [];

    if (email === 'admin@demo.com' && password === 'admin') {
      userData = {
        id: 1,
        email: 'admin@demo.com',
        name: 'Admin User',
        role: 'admin',
      };
      userAbilityRules = [
        { action: 'manage', subject: 'all' },
      ];
    } else if (email === 'client@demo.com' && password === 'client') {
      userData = {
        id: 2,
        email: 'client@demo.com',
        name: 'Client User',
        role: 'client',
      };
      userAbilityRules = [
        { action: 'read', subject: 'tickets' },
        { action: 'create', subject: 'tickets' },
      ];
    } else {
      return res.status(401).json({
        errors: {
          email: 'Invalid email or password',
          password: 'Invalid email or password',
        },
      });
    }

    // Generate mock access token
    const accessToken = jwt.sign(
      { userId: userData.id, email: userData.email },
      'mock-secret-key', // In production, use a real secret
      { expiresIn: '1h' }
    );

    res.json({
      accessToken,
      userData,
      userAbilityRules,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
};
