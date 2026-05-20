const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const PROJECT_ROOT = path.join(__dirname, '..', '..')

// Файлы и директории, которые нужно исключить из проверки
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'backups',
  'public/uploads',
  '.log',
  '.tmp',
  '.cache',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env',
  '.env.local',
  '.DS_Store',
  'Thumbs.db',
]

// Директории для проверки
const SCAN_DIRECTORIES = ['backend', 'src']

// Получить список файлов для проверки
const getFileList = (dir, baseDir = dir) => {
  const files = []

  if (!fs.existsSync(dir))
    return files

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const relativePath = path.relative(baseDir, fullPath)

    // Проверяем, нужно ли исключить
    if (EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.includes('*'))
        return relativePath.match(new RegExp(`^${pattern.replace('*', '.*')}`))

      return relativePath.includes(pattern)
    }))
      continue

    const stat = fs.statSync(fullPath)

    if (stat.isDirectory())
      files.push(...getFileList(fullPath, baseDir))
    else if (stat.isFile())
      files.push(relativePath)
  }

  return files
}

// Вычислить хэш файла
const calculateFileHash = filePath => {
  const content = fs.readFileSync(filePath)

  return crypto.createHash('sha256').update(content).digest('hex')
}

// Сканировать проект и получить хэши всех файлов
const scanProject = async () => {
  const results = {}
  const projectRoot = PROJECT_ROOT

  for (const dir of SCAN_DIRECTORIES) {
    const fullDir = path.join(projectRoot, dir)
    const files = getFileList(fullDir, fullDir)

    for (const relativePath of files) {
      const fullPath = path.join(fullDir, relativePath)
      try {
        const hash = calculateFileHash(fullPath)

        results[`${dir}/${relativePath}`] = hash
      }
      catch (err) {
        console.error(`Error hashing ${fullPath}:`, err.message)
      }
    }
  }

  return results
}

// Сохранить хэши в файл
const saveHashes = async hashes => {
  const hashesPath = path.join(PROJECT_ROOT, 'integrity-hashes.json')

  fs.writeFileSync(hashesPath, JSON.stringify(hashes, null, 2))
}

// Загрузить хэши из файла
const loadHashes = async () => {
  const hashesPath = path.join(PROJECT_ROOT, 'integrity-hashes.json')
  if (fs.existsSync(hashesPath))
    return JSON.parse(fs.readFileSync(hashesPath, 'utf8'))

  return null
}

// Получить текущее состояние целостности
const getIntegrityStatus = async (req, res) => {
  try {
    const currentHashes = await scanProject()
    const savedHashes = await loadHashes()

    if (!savedHashes) {
      return res.json({
        initialized: false,
        message: 'Хэши не инициализированы. Сначала создайте базовые хэши.',
        filesScanned: Object.keys(currentHashes).length,
        changedFiles: [],
        newFiles: [],
        removedFiles: [],
      })
    }

    const changedFiles = []
    const newFiles = []
    const removedFiles = []

    // Проверяем измененные и новые файлы
    for (const [filePath, hash] of Object.entries(currentHashes)) {
      if (!savedHashes[filePath]) {
        newFiles.push({ path: filePath, status: 'new' })
      }
      else if (savedHashes[filePath] !== hash) {
        changedFiles.push({
          path: filePath,
          oldHash: savedHashes[filePath],
          newHash: hash,
          status: 'modified',
        })
      }
    }

    // Проверяем удаленные файлы
    for (const filePath of Object.keys(savedHashes)) {
      if (!currentHashes[filePath])
        removedFiles.push({ path: filePath, status: 'removed' })
    }

    const isOk = changedFiles.length === 0 && newFiles.length === 0 && removedFiles.length === 0

    res.json({
      initialized: true,
      isOk,
      message: isOk ? 'Целостность файлов подтверждена' : 'Обнаружены изменения в файлах',
      filesScanned: Object.keys(currentHashes).length,
      filesTracked: Object.keys(savedHashes).length,
      changedFiles,
      newFiles,
      removedFiles,
      lastChecked: new Date().toISOString(),
    })
  }
  catch (error) {
    console.error('Error checking integrity:', error)
    res.status(500).json({ message: 'Ошибка при проверке целостности', error: error.message })
  }
}

// Инициализировать (пересоздать) хэши
const initializeHashes = async (req, res) => {
  try {
    const hashes = await scanProject()

    await saveHashes(hashes)

    res.json({
      success: true,
      message: 'Хэши успешно инициализированы',
      filesCount: Object.keys(hashes).length,
      timestamp: new Date().toISOString(),
    })
  }
  catch (error) {
    console.error('Error initializing hashes:', error)
    res.status(500).json({ message: 'Ошибка при инициализации хэшей', error: error.message })
  }
}

// Получить список файлов с хэшами
const getHashesList = async (req, res) => {
  try {
    const hashes = await loadHashes()

    if (!hashes) {
      return res.json({
        initialized: false,
        message: 'Хэши не инициализированы',
        files: [],
      })
    }

    const files = Object.entries(hashes).map(([path, hash]) => ({
      path,
      hash,
      truncatedHash: hash.substring(0, 12),
    }))

    res.json({
      initialized: true,
      filesCount: files.length,
      files,
    })
  }
  catch (error) {
    console.error('Error getting hashes list:', error)
    res.status(500).json({ message: 'Ошибка при получении списка хэшей', error: error.message })
  }
}

// Удалить хэши (сброс)
const resetHashes = async (req, res) => {
  try {
    const hashesPath = path.join(PROJECT_ROOT, 'integrity-hashes.json')

    if (fs.existsSync(hashesPath))
      fs.unlinkSync(hashesPath)

    res.json({
      success: true,
      message: 'Хэши успешно сброшены',
    })
  }
  catch (error) {
    console.error('Error resetting hashes:', error)
    res.status(500).json({ message: 'Ошибка при сбросе хэшей', error: error.message })
  }
}

module.exports = {
  getIntegrityStatus,
  initializeHashes,
  getHashesList,
  resetHashes,
}
