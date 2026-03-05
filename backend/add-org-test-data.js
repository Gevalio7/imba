const { pool } = require('./config/db');

// Генерация случайного имени
function getRandomName(gender = 'male') {
  const maleNames = ['Александр', 'Дмитрий', 'Иван', 'Сергей', 'Андрей', 'Николай', 'Михаил', 'Владимир', 'Евгений', 'Константин', 'Павел', 'Антон', 'Олег', 'Виктор', 'Юрий', 'Борис', 'Григорий', 'Артем', 'Илья', 'Кирилл']
  const femaleNames = ['Елена', 'Мария', 'Анна', 'Наталья', 'Ольга', 'Светлана', 'Ирина', 'Екатерина', 'Анастасия', 'Юлия', 'Татьяна', 'Людмила', 'Галина', 'Полина', 'Дарья', 'Ксения', 'Алиса', 'Марина', 'Вера', 'Надежда']
  
  if (gender === 'male') {
    return maleNames[Math.floor(Math.random() * maleNames.length)]
  } else {
    return femaleNames[Math.floor(Math.random() * femaleNames.length)]
  }
}

// Генерация случайной фамилии
function getRandomLastName(gender = 'male') {
  const maleLastNames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Васильев', 'Попов', 'Соколов', 'Михайлов', 'Фёдоров', 'Андреев', 'Алексеев', 'Николаев', 'Дмитриев', 'Захаров', 'Зайцев', 'Павлов', 'Орлов', 'Романов', 'Макаров']
  const femaleLastNames = ['Иванова', 'Петрова', 'Сидорова', 'Смирнова', 'Кузнецова', 'Васильева', 'Попова', 'Соколова', 'Михайлова', 'Фёдорова', 'Андреева', 'Алексеева', 'Николаева', 'Дмитриева', 'Захарова', 'Зайцева', 'Павлова', 'Орлова', 'Романова', 'Макарова']
  
  if (gender === 'male') {
    return maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
  } else {
    return femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)]
  }
}

// Генерация случайного логина
function generateLogin(firstName, lastName) {
  const variant = Math.floor(Math.random() * 3)
  const first = firstName.toLowerCase().slice(0, 3)
  const last = lastName.toLowerCase().slice(0, 4)
  
  switch (variant) {
    case 0:
      return `${first}.${last}`
    case 1:
      return `${first}${last}`
    default:
      return `${first}_${last}${Math.floor(Math.random() * 99)}`
  }
}

// Генерация случайного email
function generateEmail(firstName, lastName) {
  const domains = ['example.com', 'company.ru', 'org.net', 'mail.com', 'corp.io']
  const first = firstName.toLowerCase()
  const last = lastName.toLowerCase()
  const domain = domains[Math.floor(Math.random() * domains.length)]
  
  return `${first}.${last}@${domain}`
}

// Генерация случайного телефона
function generatePhone() {
  const prefixes = ['+7', '8']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const code = Math.floor(Math.random() * 900) + 100
  const num1 = Math.floor(Math.random() * 900) + 100
  const num2 = Math.floor(Math.random() * 90) + 10
  const num3 = Math.floor(Math.random() * 90) + 10
  
  return `${prefix} (${code}) ${num1}-${num2}-${num3}`
}

// Генерация случайного Telegram
function generateTelegram() {
  const names = ['alex', 'dmitry', 'ivan', 'sergey', 'user', 'manager', 'admin', 'dev']
  const name = names[Math.floor(Math.random() * names.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  
  return `@${name}${num}`
}

// Названия групп
const groupNames = [
  'Отдел продаж',
  'Техническая поддержка',
  'Бухгалтерия',
  'Маркетинг',
  'HR'
]

// Название компании
const companyName = 'Тестовая компания'

async function addOrgTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Начало генерации тестовых данных...')
    
    // Начинаем транзакцию
    await client.query('BEGIN')
    
    // 1. Создаем или получаем компанию
    let companyResult = await client.query(
      'SELECT id FROM customers WHERE name = $1',
      [companyName]
    )
    
    let companyId
    if (companyResult.rows.length === 0) {
      const newCompany = await client.query(
        `INSERT INTO customers (name, city, is_active) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [companyName, 'Москва', true]
      )
      companyId = newCompany.rows[0].id
      console.log('✅ Создана компания:', companyName, '(ID:', companyId + ')')
    } else {
      companyId = companyResult.rows[0].id
      console.log('ℹ️  Компания уже существует:', companyName, '(ID:', companyId + ')')
    }
    
    // 2. Создаем 5 групп
    const groupIds = []
    for (const groupName of groupNames) {
      let groupResult = await client.query(
        'SELECT id FROM customers_groups WHERE name = $1 AND customer_id = $2',
        [groupName, companyId]
      )
      
      let groupId
      if (groupResult.rows.length === 0) {
        const newGroup = await client.query(
          `INSERT INTO customers_groups (name, message, customer_id, is_active) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id`,
          [groupName, `Группа ${groupName}`, companyId, true]
        )
        groupId = newGroup.rows[0].id
        console.log('✅ Создана группа:', groupName, '(ID:', groupId + ')')
      } else {
        groupId = groupResult.rows[0].id
        console.log('ℹ️  Группа уже существует:', groupName, '(ID:', groupId + ')')
      }
      groupIds.push(groupId)
    }
    
    // 3. Создаем по 20 сотрудников в каждой группе
    const usersPerGroup = 20
    let totalUsersCreated = 0
    
    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i]
      const groupName = groupNames[i]
      
      console.log(`📂 Создание ${usersPerGroup} сотрудников в группе "${groupName}"...`)
      
      for (let j = 0; j < usersPerGroup; j++) {
        // Чередуем пол
        const gender = j % 2 === 0 ? 'male' : 'female'
        
        const firstName = getRandomName(gender)
        const lastName = getRandomLastName(gender)
        const login = generateLogin(firstName, lastName)
        const email = generateEmail(firstName, lastName)
        const mobilePhone = generatePhone()
        const telegramAccount = generateTelegram()
        
        // Проверяем, существует ли пользователь с таким логином
        const existingUser = await client.query(
          'SELECT id FROM customer_users WHERE login = $1',
          [login]
        )
        
        if (existingUser.rows.length === 0) {
          await client.query(
            `INSERT INTO customer_users 
             (first_name, last_name, login, email, mobile_phone, telegram_account, customer_id, customers_group_id, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [firstName, lastName, login, email, mobilePhone, telegramAccount, companyId, groupId, true]
          )
          totalUsersCreated++
        } else {
          // Если пользователь существует, просто обновляем его группу
          await client.query(
            'UPDATE customer_users SET customers_group_id = $1, customer_id = $2 WHERE login = $3',
            [groupId, companyId, login]
          )
          console.log('  ℹ️  Обновлен существующий пользователь:', login)
        }
      }
      
      console.log(`✅ Создано/обновлено ${usersPerGroup} сотрудников в группе "${groupName}"`)
    }
    
    // Фиксируем транзакцию
    await client.query('COMMIT')
    
    console.log('\n🎉 Генерация завершена!')
    console.log(`📊 Итого:`)
    console.log(`   - Компания: ${companyName} (ID: ${companyId})`)
    console.log(`   - Групп: ${groupIds.length}`)
    console.log(`   - Сотрудников создано/обновлено: ${totalUsersCreated}`)
    
    process.exit(0)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Ошибка:', err)
    process.exit(1)
  } finally {
    client.release()
  }
}

addOrgTestData()
