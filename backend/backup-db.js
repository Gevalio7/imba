const { exec } = require('node:child_process')
const path = require('node:path')

require('dotenv').config()

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupFile = path.join(__dirname, 'backups', `backup_${timestamp}.sql`)

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env

  const command = `pg_dump --host=${DB_HOST} --port=${DB_PORT} --username=${DB_USER} --dbname=${DB_NAME} --file=${backupFile} --format=custom --compress=9 --verbose`

  console.log('🚀 Создание бэкапа базы данных...')
  console.log(`📁 Файл бэкапа: ${backupFile}`)

  exec(command, { env: { ...process.env, PGPASSWORD: DB_PASSWORD } }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Ошибка создания бэкапа:', error)

      return
    }
    if (stderr)
      console.log('⚠️  Предупреждения:', stderr)

    console.log('✅ Бэкап создан успешно:', stdout)
    console.log(`📦 Размер файла: ${require('node:fs').statSync(backupFile).size} bytes`)
  })
}

backupDatabase()
