const { pool } = require('./config/db');

// Названия компаний
const companies = [
  { name: 'ООО "ТехноСтрой"', city: 'Москва', street: 'ул. Строителей, 15', zip: '115093', comment: 'Строительная компания', isActive: true },
  { name: 'ЗАО "Новые Технологии"', city: 'Санкт-Петербург', street: 'пр. Невский, 45', zip: '191025', comment: 'IT-решения для бизнеса', isActive: true },
  { name: 'ООО "ЭкоПродукт"', city: 'Екатеринбург', street: 'ул. Ленина, 22', zip: '620014', comment: 'Производство экологичных продуктов', isActive: true },
  { name: 'АО "ФинансГрупп"', city: 'Москва', street: 'ул. Арбат, 10', zip: '119002', comment: 'Финансовые услуги', isActive: true },
  { name: 'ООО "МедСервис"', city: 'Новосибирск', street: 'ул. Мира, 5', zip: '630090', comment: 'Медицинское оборудование', isActive: true },
  { name: 'ПАО "ЭнергоМаш"', city: 'Челябинск', street: 'ул. Победы, 30', zip: '454000', comment: 'Энергетическое машиностроение', isActive: true },
  { name: 'ООО "Торговая Сеть"', city: 'Казань', street: 'ул. Баумана, 12', zip: '420111', comment: 'Розничная торговля', isActive: true },
  { name: 'ООО "ЛогистикПро"', city: 'Нижний Новгород', street: 'ул. Горького, 8', zip: '603005', comment: 'Грузоперевозки', isActive: true },
  { name: 'АО "АгроФерма"', city: 'Краснодар', street: 'ул. Красная, 55', zip: '350000', comment: 'Сельское хозяйство', isActive: true },
  { name: 'ЗАО "ОбразованиеПлюс"', city: 'Москва', street: 'ул. Чехова, 3', zip: '103009', comment: 'Образовательные услуги', isActive: true },
  { name: 'ООО "АвтоДилер"', city: 'Самара', street: 'ул. Гагарина, 20', zip: '443010', comment: 'Продажа автомобилей', isActive: false },
  { name: 'ПАО "Металлург"', city: 'Магнитогорск', street: 'пр. Ленина, 50', zip: '455000', comment: 'Черная металлургия', isActive: true },
  { name: 'ООО "Рекламное Агентство"', city: 'Москва', street: 'ул. Тверская, 7', zip: '125009', comment: 'Реклама и маркетинг', isActive: true },
  { name: 'АО "СтройМатериалы"', city: 'Пермь', street: 'ул. Комсомольская, 18', zip: '614000', comment: 'Производство стройматериалов', isActive: true },
  { name: 'ООО "Консалтинг Центр"', city: 'Воронеж', street: 'ул. Кирова, 9', zip: '394000', comment: 'Бизнес-консалтинг', isActive: false }
];

async function addTestCustomers() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Начало добавления тестовых компаний...')
    
    // Начинаем транзакцию
    await client.query('BEGIN')
    
    let companiesCreated = 0
    let companiesSkipped = 0
    
    for (const company of companies) {
      // Проверяем, существует ли компания с таким названием
      const existingCompany = await client.query(
        'SELECT id FROM customers WHERE name = $1',
        [company.name]
      )
      
      if (existingCompany.rows.length > 0) {
        console.log('ℹ️  Компания уже существует:', company.name)
        companiesSkipped++
      } else {
        await client.query(
          `INSERT INTO customers (name, city, street, zip, comment, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [company.name, company.city, company.street, company.zip, company.comment, company.isActive]
        )
        console.log('✅ Создана компания:', company.name, '-', company.city)
        companiesCreated++
      }
    }
    
    // Фиксируем транзакцию
    await client.query('COMMIT')
    
    console.log('\n🎉 Добавление компаний завершено!')
    console.log(`📊 Итого:`)
    console.log(`   - Создано: ${companiesCreated}`)
    console.log(`   - Пропущено (уже существуют): ${companiesSkipped}`)
    console.log(`   - Всего в базе: ${companiesCreated + companiesSkipped}`)
    
    process.exit(0)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Ошибка:', err)
    process.exit(1)
  } finally {
    client.release()
  }
}

addTestCustomers()
