-- Изменить response_time и resolution_time на DECIMAL для поддержки дробных часов
ALTER TABLE sla ALTER COLUMN response_time TYPE DECIMAL(10,2);
ALTER TABLE sla ALTER COLUMN resolution_time TYPE DECIMAL(10,2);
