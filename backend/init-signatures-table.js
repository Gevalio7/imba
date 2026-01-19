const { pool } = require('./config/db');
const Signatures = require('./models/signatures');

async function initSignaturesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы signatures тестовыми данными...');

    // Получаем существующие подписи
    const existingData = await pool.query('SELECT name FROM signatures');
    const existingNames = existingData.rows.map(row => row.name);

    // Тестовые данные для подписей
    const testSignatures = [
      { name: 'Стандартная подпись', content: 'С уважением,\nКоманда поддержки', isActive: true },
      { name: 'Техническая поддержка', content: 'Техническая поддержка\nsupport@company.com', isActive: true },
      { name: 'Администратор', content: 'Администратор системы\nadmin@company.com', isActive: true },
      { name: 'Менеджер', content: 'Менеджер по работе с клиентами\nmanager@company.com', isActive: true },
      { name: 'Консультант', content: 'Консультационная служба\nconsultant@company.com', isActive: true },
      { name: 'Служба безопасности', content: 'Служба информационной безопасности\nsecurity@company.com', isActive: true },
      { name: 'Финансовый отдел', content: 'Финансовый отдел\nfinance@company.com', isActive: true },
      { name: 'Отдел кадров', content: 'Отдел кадров\nhr@company.com', isActive: true },
      { name: 'Юридический отдел', content: 'Юридический отдел\nlegal@company.com', isActive: true },
      { name: 'Маркетинг', content: 'Отдел маркетинга\nmarketing@company.com', isActive: true },
    ];

    let addedCount = 0;

    console.log('📝 Вставка тестовых данных...');

    for (const signature of testSignatures) {
      if (!existingNames.includes(signature.name)) {
        await Signatures.create(signature);
        console.log(`   ✅ Добавлена подпись: ${signature.name}`);
        addedCount++;
      } else {
        console.log(`   ℹ️  Подпись "${signature.name}" уже существует, пропускаем`);
      }
    }

    console.log('✅ Наполнение таблицы signatures завершено успешно');
    console.log(`   Добавлено ${addedCount} новых тестовых записей`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка наполнения таблицы signatures:', error);
    process.exit(1);
  }
}

initSignaturesTable();
