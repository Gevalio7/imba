const crypto = require('node:crypto')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 16
const KEY_LENGTH = 32 // 256 bits

function getKey() {
  const key = process.env.MAIL_PASSWORD_ENCRYPTION_KEY
  if (!key) {
    // В dev можно отключить шифрование, в проде — обязательно
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MAIL_PASSWORD_ENCRYPTION_KEY is required in production')
    }
    console.warn('[CRYPTO] MAIL_PASSWORD_ENCRYPTION_KEY not set — passwords will be stored in plain text (DEV ONLY)')
    return null
  }
  // Derive 32-byte key from the env string
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Шифрует текст (пароль почты)
 * @param {string} plaintext
 * @returns {string} base64( iv + tag + ciphertext )
 */
function encrypt(plaintext) {
  if (plaintext == null) return plaintext
  const key = getKey()
  if (!key) return plaintext // dev fallback

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const tag = cipher.getAuthTag()

  // Формат: iv(12) + tag(16) + ciphertext
  const result = Buffer.concat([iv, tag, encrypted])
  return result.toString('base64')
}

/**
 * Расшифровывает
 * @param {string} encryptedBase64
 * @returns {string}
 */
function decrypt(encryptedBase64) {
  if (encryptedBase64 == null) return encryptedBase64
  const key = getKey()
  if (!key) return encryptedBase64 // dev fallback — plain text

  // Если это выглядит как plain text (нет base64 или слишком коротко) — возвращаем как есть
  if (typeof encryptedBase64 !== 'string' || encryptedBase64.length < 30) {
    return encryptedBase64
  }

  try {
    const data = Buffer.from(encryptedBase64, 'base64')
    if (data.length < IV_LENGTH + TAG_LENGTH) {
      return encryptedBase64 // явно не зашифровано
    }

    const iv = data.subarray(0, IV_LENGTH)
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const ciphertext = data.subarray(IV_LENGTH + TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (err) {
    // Не бросаем ошибку — просто возвращаем оригинал (backward compat с plain passwords)
    console.warn('[CRYPTO] Decrypt failed for value — treating as plain text (old password)')
    return encryptedBase64
  }
}

/**
 * Утилита для миграции существующих plain паролей в зашифрованные.
 * Использовать один раз через скрипт.
 */
async function encryptAllPasswordsInDB(pool) {
  // Пример использования в отдельном скрипте:
  // const accounts = await pool.query('SELECT id, password, smtp_password FROM post_master_mail_accounts')
  // for (const acc of accounts.rows) {
  //   const updates = {}
  //   if (acc.password) updates.password = encrypt(acc.password)
  //   if (acc.smtp_password) updates.smtp_password = encrypt(acc.smtp_password)
  //   if (Object.keys(updates).length) {
  //     await pool.query('UPDATE ... SET ..., password_encrypted = true')
  //   }
  // }
  console.log('[CRYPTO] encryptAllPasswordsInDB — реализуйте в отдельном скрипте миграции')
}

module.exports = {
  encrypt,
  decrypt,
  encryptAllPasswordsInDB,
}
