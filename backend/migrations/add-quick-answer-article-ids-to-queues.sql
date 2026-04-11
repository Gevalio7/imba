-- Add quick_answer_article_ids column to queues table
ALTER TABLE queues ADD COLUMN IF NOT EXISTS quick_answer_article_ids INTEGER[];