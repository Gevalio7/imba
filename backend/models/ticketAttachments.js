const fs = require('node:fs')
const path = require('node:path')
const { pool } = require('../config/db')

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

class TicketAttachments {
  static tableName = 'ticket_attachments'
  static uploadDir = path.join(__dirname, '..', 'uploads')

  // Убедимся, что директория для загрузок существует
  static ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir))
      fs.mkdirSync(this.uploadDir, { recursive: true })
  }

  static async getAll(options = {}) {
    const { ticketId, sortBy, orderBy = 'asc', itemsPerPage = 10000, page = 1 } = options

    try {
      let whereClause = ''
      const params = []
      let paramIndex = 1

      // Фильтр по ticketId
      if (ticketId) {
        whereClause = `WHERE ticket_id = $${paramIndex}`
        params.push(ticketId)
        paramIndex++
      }

      let orderClause = 'ORDER BY created_at DESC'
      const sortableFields = ['fileName', 'fileSize', 'createdAt']
      if (sortBy && sortableFields.includes(sortBy))
        orderClause = `ORDER BY ${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`

      const offset = (page - 1) * itemsPerPage

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${TicketAttachments.tableName} ${whereClause}`
      const countResult = await pool.query(countQuery, params)
      const total = Number.parseInt(countResult.rows[0].total)

      // Get paginated data
      const dataQuery = `
        SELECT 
          id, 
          ticket_id as "ticketId", 
          file_name as "filename", 
          file_path as "originalName",
          mime_type as "mimetype", 
          file_size as "filesize", 
          uploaded_by as "uploaderId",
          created_at as "createdAt"
        FROM ${TicketAttachments.tableName}
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramIndex} 
        OFFSET $${paramIndex + 1}
      `

      params.push(itemsPerPage, offset)

      const dataResult = await pool.query(dataQuery, params)

      return {
        attachments: dataResult.rows,
        total,
      }
    }
    catch (error) {
      console.error('Error in getAll:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          ticket_id as "ticketId", 
          file_name as "filename", 
          file_path as "originalName",
          mime_type as "mimetype", 
          file_size as "filesize", 
          uploaded_by as "uploaderId",
          created_at as "createdAt"
        FROM ${TicketAttachments.tableName}
        WHERE id = $1`,
        [id],
      )

      return result.rows[0] || null
    }
    catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  static async create(fileData) {
    try {
      this.ensureUploadDir()

      const { ticketId, filename, originalName, mimetype, filesize, uploaderId } = fileData

      const query = `
        INSERT INTO ${TicketAttachments.tableName} (ticket_id, file_name, file_path, file_size, mime_type, uploaded_by) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING 
          id, 
          ticket_id as "ticketId", 
          file_name as "filename", 
          file_path as "originalName",
          mime_type as "mimetype", 
          file_size as "filesize", 
          uploaded_by as "uploaderId",
          created_at as "createdAt"
      `

      const result = await pool.query(query, [
        ticketId,
        filename, // file_name - имя файла на диске (для отображения)
        filename, // file_path - путь к файлу на сервере
        filesize,
        mimetype,
        uploaderId || null,
      ])

      return result.rows[0]
    }
    catch (error) {
      console.error('Error in create:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      // Сначала получаем информацию о файле
      const attachment = await this.getById(id)
      if (!attachment)
        return false

      // Удаляем файл с диска (используем file_path)
      const filePath = path.join(this.uploadDir, attachment.originalName)
      if (fs.existsSync(filePath))
        fs.unlinkSync(filePath)

      // Удаляем запись из базы
      const result = await pool.query(`DELETE FROM ${TicketAttachments.tableName} WHERE id = $1`, [id])

      return result.rowCount > 0
    }
    catch (error) {
      console.error('Error in delete:', error)
      throw error
    }
  }

  static async deleteByTicketId(ticketId) {
    try {
      // Получаем все вложения тикета
      const { attachments } = await this.getAll({ ticketId })

      // Удаляем файлы с диска (используем originalName = file_path)
      for (const attachment of attachments) {
        const filePath = path.join(this.uploadDir, attachment.originalName)
        if (fs.existsSync(filePath))
          fs.unlinkSync(filePath)
      }

      // Удаляем записи из базы
      const result = await pool.query(`DELETE FROM ${TicketAttachments.tableName} WHERE ticket_id = $1`, [ticketId])

      return result.rowCount
    }
    catch (error) {
      console.error('Error in deleteByTicketId:', error)
      throw error
    }
  }

  // Метод для сохранения файла на диск
  static async saveFile(file) {
    this.ensureUploadDir()

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    const filename = `ticket-${uniqueSuffix}${ext}`
    const filePath = path.join(this.uploadDir, filename)

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, err => {
        if (err)
          reject(err)
        else
          resolve(filename)
      })
    })
  }
}

module.exports = TicketAttachments
