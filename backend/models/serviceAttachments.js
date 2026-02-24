const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class ServiceAttachments {
  static tableName = 'service_attachments';
  static uploadDir = path.join(__dirname, '..', 'uploads', 'services');

  // Убедимся, что директория для загрузок существует
  static ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  static async getAll(options = {}) {
    const { serviceId, sortBy, orderBy = 'asc', itemsPerPage = 100, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      // Фильтр по serviceId
      if (serviceId) {
        whereClause = `WHERE service_id = $${paramIndex}`;
        params.push(serviceId);
        paramIndex++;
      }

      let orderClause = 'ORDER BY created_at DESC';
      const sortableFields = ['fileName', 'fileSize', 'createdAt'];
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${toSnakeCase(sortBy)} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${ServiceAttachments.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `
        SELECT 
          id, 
          service_id as "serviceId", 
          file_name as "fileName", 
          file_path as "filePath",
          file_size as "fileSize", 
          mime_type as "mimeType", 
          uploaded_by as "uploadedBy",
          created_at as "createdAt"
        FROM ${ServiceAttachments.tableName}
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramIndex} 
        OFFSET $${paramIndex + 1}
      `;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        attachments: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT 
          id, 
          service_id as "serviceId", 
          file_name as "fileName", 
          file_path as "filePath",
          file_size as "fileSize", 
          mime_type as "mimeType", 
          uploaded_by as "uploadedBy",
          created_at as "createdAt"
        FROM ${ServiceAttachments.tableName}
        WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(fileData) {
    try {
      this.ensureUploadDir();
      
      const { serviceId, filename, originalName, mimetype, filesize, uploaderId } = fileData;
      
      // Декодируем имя файла из UTF-8 если оно было закодировано
      let decodedName = originalName || filename;
      try {
        // Пробуем декодировать из latin1 в utf8 (частая проблема с multer)
        decodedName = Buffer.from(originalName, 'latin1').toString('utf8');
      } catch (e) {
        // Если декодирование не удалось, используем оригинальное имя
        decodedName = originalName || filename;
      }
      
      const query = `
        INSERT INTO ${ServiceAttachments.tableName} (service_id, file_name, file_path, file_size, mime_type, uploaded_by) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING 
          id, 
          service_id as "serviceId", 
          file_name as "fileName", 
          file_path as "filePath",
          file_size as "fileSize", 
          mime_type as "mimeType", 
          uploaded_by as "uploadedBy",
          created_at as "createdAt"
      `;
      const result = await pool.query(query, [
        serviceId,
        decodedName, // file_name - оригинальное имя файла (декодированное)
        filename, // file_path - путь к файлу на сервере
        filesize,
        mimetype,
        uploaderId || null,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Сначала получаем информацию о файле
      const attachment = await this.getById(id);
      if (!attachment) {
        return false;
      }

      // Удаляем файл с диска асинхронно
      const filePath = path.join(this.uploadDir, attachment.filePath);
      try {
        await fs.promises.unlink(filePath);
      } catch (unlinkError) {
        // Игнорируем ошибку если файл не существует
        if (unlinkError.code !== 'ENOENT') {
          console.error('Warning: Could not delete file:', unlinkError.message);
        }
      }

      // Удаляем запись из базы
      const result = await pool.query(`DELETE FROM ${ServiceAttachments.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async deleteByServiceId(serviceId) {
    try {
      // Получаем все вложения сервиса
      const { attachments } = await this.getAll({ serviceId });
      
      // Удаляем файлы с диска асинхронно
      const deletePromises = attachments.map(async (attachment) => {
        const filePath = path.join(this.uploadDir, attachment.filePath);
        try {
          await fs.promises.unlink(filePath);
        } catch (unlinkError) {
          // Игнорируем ошибку если файл не существует
          if (unlinkError.code !== 'ENOENT') {
            console.error('Warning: Could not delete file:', unlinkError.message);
          }
        }
      });
      await Promise.all(deletePromises);

      // Удаляем записи из базы
      const result = await pool.query(`DELETE FROM ${ServiceAttachments.tableName} WHERE service_id = $1`, [serviceId]);

      return result.rowCount;
    } catch (error) {
      console.error('Error in deleteByServiceId:', error);
      throw error;
    }
  }

  // Метод для сохранения файла на диск
  static async saveFile(file) {
    this.ensureUploadDir();
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `service-${uniqueSuffix}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    
    await fs.promises.writeFile(filePath, file.buffer);
    return filename;
  }

  // Проверка наличия вложений у сервиса
  static async hasAttachments(serviceId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM service_attachments WHERE service_id = $1',
        [serviceId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error in hasAttachments:', error);
      throw error;
    }
  }

  // Проверка наличия вложений у списка сервисов (оптимизированная версия)
  static async hasAttachmentsBatch(serviceIds) {
    try {
      if (!serviceIds || serviceIds.length === 0) {
        return {};
      }
      
      const result = await pool.query(
        `SELECT DISTINCT service_id FROM service_attachments WHERE service_id = ANY($1)`,
        [serviceIds]
      );
      
      // Создаём мапу: serviceId -> hasAttachments
      const attachmentsMap = {};
      const idsWithAttachments = new Set(result.rows.map(r => r.service_id));
      
      serviceIds.forEach(id => {
        attachmentsMap[id] = idsWithAttachments.has(id);
      });
      
      return attachmentsMap;
    } catch (error) {
      console.error('Error in hasAttachmentsBatch:', error);
      throw error;
    }
  }
}

module.exports = ServiceAttachments;
