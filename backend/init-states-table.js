const { pool } = require('./config/db');
const States = require('./models/states');

async function initStatesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы states тестовыми данными...');

    // Получаем существующие состояния
    const existingData = await pool.query('SELECT name FROM states');
    const existingNames = existingData.rows.map(row => row.name);

    // Тестовые данные для состояний
    const testStates = [
      { name: 'Новый', comment: 'Новое обращение, поступившее в систему', type: 'new', color: '#007bff', isActive: true },
      { name: 'Открыт', comment: 'Обращение принято в работу', type: 'open', color: '#28a745', isActive: true },
      { name: 'В работе', comment: 'Обращение находится в процессе обработки', type: 'pending', color: '#ffc107', isActive: true },
      { name: 'Ожидание клиента', comment: 'Ожидание дополнительной информации от клиента', type: 'pending', color: '#17a2b8', isActive: true },
      { name: 'Ожидание поставщика', comment: 'Ожидание ответа от внешнего поставщика услуг', type: 'pending', color: '#6f42c1', isActive: true },
      { name: 'Решен', comment: 'Проблема решена, ожидание подтверждения от клиента', type: 'closed', color: '#20c997', isActive: true },
      { name: 'Закрыт', comment: 'Обращение успешно завершено', type: 'closed', color: '#6c757d', isActive: true },
      { name: 'Отклонен', comment: 'Обращение отклонено', type: 'closed', color: '#dc3545', isActive: true },
      { name: 'На удержании', comment: 'Обращение временно приостановлено', type: 'pending', color: '#fd7e14', isActive: true },
      { name: 'Эскалирован', comment: 'Обращение передано на более высокий уровень поддержки', type: 'open', color: '#e83e8c', isActive: true },
    ];

    let addedCount = 0;

    console.log('📝 Вставка тестовых данных...');

    for (const state of testStates) {
      if (!existingNames.includes(state.name)) {
        await States.create(state);
        console.log(`   ✅ Добавлено состояние: ${state.name}`);
        addedCount++;
      } else {
        console.log(`   ℹ️  Состояние "${state.name}" уже существует, пропускаем`);
      }
    }

    console.log('✅ Наполнение таблицы states завершено успешно');
    console.log(`   Добавлено ${addedCount} новых тестовых записей`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка наполнения таблицы states:', error);
    process.exit(1);
  }
}

initStatesTable();
