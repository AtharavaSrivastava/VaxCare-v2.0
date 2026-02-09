-- Initialize database with proper settings for healthcare data
-- This script runs when the PostgreSQL container starts for the first time

-- Set timezone to UTC for consistency
SET timezone = 'UTC';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database user if not exists (handled by Docker environment variables)
-- The main database and user are created by Docker

-- Set up proper permissions and security settings
ALTER DATABASE vaxcare_db SET log_statement = 'all';
ALTER DATABASE vaxcare_db SET log_min_duration_statement = 1000;

-- Create audit function for sensitive data changes
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, 
            ip_address, created_at
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD),
            inet_client_addr(), CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, old_values, new_values,
            ip_address, created_at
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW),
            inet_client_addr(), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, action, table_name, record_id, new_values,
            ip_address, created_at
        ) VALUES (
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
            TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW),
            inet_client_addr(), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;