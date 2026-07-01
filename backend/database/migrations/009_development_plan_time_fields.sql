-- Add optional time range fields for development plan timelines.

ALTER TABLE development_plans
ADD COLUMN IF NOT EXISTS timeline_start_time time,
ADD COLUMN IF NOT EXISTS timeline_end_time time;
