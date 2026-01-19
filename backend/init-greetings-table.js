const { pool } = require('./config/db');
const Greetings = require('./models/greetings');

async function initGreetingsTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы greetings тестовыми данными...');

    // Получаем существующие приветствия
    const existingData = await pool.query('SELECT name FROM greetings');
    const existingNames = existingData.rows.map(row => row.name);

    // Тестовые данные для приветствий
    const testGreetings = [
      {
        name: 'Добрый день',
        content: 'Добрый день!\n\n',
        comment: 'Стандартное приветствие для дневного времени',
        isActive: true
      },
      {
        name: 'Здравствуйте',
        content: 'Здравствуйте!\n\n',
        comment: 'Официальное приветствие',
        isActive: true
      },
      {
        name: 'Привет',
        content: 'Привет!\n\n',
        comment: 'Неформальное приветствие',
        isActive: true
      },
      {
        name: 'Доброе утро',
        content: 'Доброе утро!\n\n',
        comment: 'Приветствие для утреннего времени',
        isActive: true
      },
      {
        name: 'Добрый вечер',
        content: 'Добрый вечер!\n\n',
        comment: 'Приветствие для вечернего времени',
        isActive: true
      },
      {
        name: 'Уважаемый клиент',
        content: 'Уважаемый клиент!\n\n',
        comment: 'Официальное приветствие для клиентов',
        isActive: true
      },
      {
        name: 'Дорогой пользователь',
        content: 'Дорогой пользователь!\n\n',
        comment: 'Приветствие для пользователей системы',
        isActive: true
      },
      {
        name: 'Рады приветствовать',
        content: 'Рады приветствовать Вас!\n\n',
        comment: 'Теплое приветствие',
        isActive: true
      }
    ];

    let addedCount = 0;

    console.log('📝 Вставка тестовых данных...');

    for (const greeting of testGreetings) {
      if (!existingNames.includes(greeting.name)) {
        await Greetings.create(greeting);
        console.log(`   ✅ Добавлено приветствие: ${greeting.name}`);
        addedCount++;
      } else {
        console.log(`   ℹ️  Приветствие "${greeting.name}" уже существует, пропускаем`);
      }
    }

    console.log('✅ Наполнение таблицы greetings завершено успешно');
    console.log(`   Добавлено ${addedCount} новых тестовых записей`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка наполнения таблицы greetings:', error);
    process.exit(1);
  }
}

initGreetingsTable();
