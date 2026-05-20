module.exports = {
  up: async (pool) => {
    // Добавляем reference_data_cache_ttl_seconds
    const check = await pool.query(
      `SELECT id FROM system_configurations WHERE key = 'reference_data_cache_ttl_seconds'`
    )

    if (check.rows.length === 0) {
      await pool.query(`
        INSERT INTO system_configurations (key, value, description, category, is_active, created_at, updated_at)
        VALUES ('reference_data_cache_ttl_seconds', '300', 'Время жизни кеша referenceData (сек). 0 = кеш отключён', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      console.log('[MIGRATION] Added reference_data_cache_ttl_seconds config')
    } else {
      console.log('[MIGRATION] reference_data_cache_ttl_seconds already exists, skipping')
    }

    // Опционально: добавляем reference_data_cache_enabled
    const checkEnabled = await pool.query(
      `SELECT id FROM system_configurations WHERE key = 'reference_data_cache_enabled'`
    )

    if (checkEnabled.rows.length === 0) {
      await pool.query(`
        INSERT INTO system_configurations (key, value, description, category, is_active, created_at, updated_at)
        VALUES ('reference_data_cache_enabled', 'true', 'Включить кеширование referenceData', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      console.log('[MIGRATION] Added reference_data_cache_enabled config')
    } else {
      console.log('[MIGRATION] reference_data_cache_enabled already exists, skipping')
    }
  },

  down: async (pool) => {
    await pool.query(`DELETE FROM system_configurations WHERE key = 'reference_data_cache_ttl_seconds'`)
    console.log('[MIGRATION] Removed reference_data_cache_ttl_seconds config')
    await pool.query(`DELETE FROM system_configurations WHERE key = 'reference_data_cache_enabled'`)
    console.log('[MIGRATION] Removed reference_data_cache_enabled config')
  }
}
