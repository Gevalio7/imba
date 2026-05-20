const { pool } = require('./config/db')
const Signatures = require('./models/signatures')

async function initSignaturesTable() {
  try {
    console.log('🔄 Проверка и наполнение таблицы signatures тестовыми данными...')

    // Получаем существующие подписи
    const existingData = await pool.query('SELECT name FROM signatures')
    const existingNames = existingData.rows.map(row => row.name)

    // Тестовые данные для подписей
    const testSignatures = [
      {
        name: 'С уважением',
        content: '\n\nС уважением,\n[Ваше имя]\n[Ваша должность]\n[Название компании]',
        comment: 'Стандартная подпись с уважением',
        isActive: true,
      },
      {
        name: 'Лучшие пожелания',
        content: '\n\nС лучшими пожеланиями,\n[Ваше имя]\n[Ваша должность]',
        comment: 'Теплая подпись с пожеланиями',
        isActive: true,
      },
      {
        name: 'Спасибо за обращение',
        content: '\n\nСпасибо за Ваше обращение!\n\nС уважением,\n[Ваше имя]',
        comment: 'Подпись с благодарностью',
        isActive: true,
      },
      {
        name: 'Официальная подпись',
        content: '\n\nС уважением,\n[Ваше имя]\n[Ваша должность]\n[Контактная информация]\n[Название компании]',
        comment: 'Полная официальная подпись',
        isActive: true,
      },
      {
        name: 'Короткая подпись',
        content: '\n\nС уважением,\n[Ваше имя]',
        comment: 'Краткая подпись',
        isActive: true,
      },
      {
        name: 'Поддержка клиентов',
        content: '\n\nКоманда поддержки\n[Название компании]\n[Контактная информация]',
        comment: 'Подпись для службы поддержки',
        isActive: true,
      },
      {
        name: 'Техническая поддержка',
        content: '\n\nТехническая поддержка\n[Ваше имя]\n[Email]\n[Телефон]',
        comment: 'Подпись для технической поддержки',
        isActive: true,
      },
      {
        name: 'Менеджер по продажам',
        content: '\n\nМенеджер по продажам\n[Ваше имя]\n[Телефон]\n[Email]',
        comment: 'Подпись для отдела продаж',
        isActive: true,
      },
    ]

    let addedCount = 0

    console.log('📝 Вставка тестовых данных...')

    for (const signature of testSignatures) {
      if (!existingNames.includes(signature.name)) {
        await Signatures.create(signature)
        console.log(`   ✅ Добавлена подпись: ${signature.name}`)
        addedCount++
      }
      else {
        console.log(`   ℹ️  Подпись "${signature.name}" уже существует, пропускаем`)
      }
    }

    console.log('✅ Наполнение таблицы signatures завершено успешно')
    console.log(`   Добавлено ${addedCount} новых тестовых записей`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ Ошибка наполнения таблицы signatures:', error)
    process.exit(1)
  }
}

initSignaturesTable()
