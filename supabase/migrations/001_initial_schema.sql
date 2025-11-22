-- =====================================================
-- MHM UBA - Supabase Database Schema Migration
-- =====================================================
-- Project: uba-production
-- Region: EU (Netherlands)
-- Database: PostgreSQL (Supabase)
-- Created: 2025-11-22
-- =====================================================

-- =====================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =====================================================
-- UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- -----------------------------------------------------
-- CLIENTS TABLE
-- Store client/customer information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- PROJECTS TABLE
-- Store project information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'in_progress', 'ongoing', 'completed', 'archived')),
    budget NUMERIC(12, 2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Add trigger to update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- TASKS TABLE
-- Store task/to-do information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Add trigger to update updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- INVOICES TABLE
-- Store invoice/billing information
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    paid_date DATE,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, invoice_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Add trigger to update updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE RLS POLICIES
-- =====================================================

-- -----------------------------------------------------
-- CLIENTS POLICIES
-- -----------------------------------------------------

-- Policy: Users can view their own clients
CREATE POLICY "Users can view own clients"
    ON clients FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own clients
CREATE POLICY "Users can insert own clients"
    ON clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own clients
CREATE POLICY "Users can update own clients"
    ON clients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own clients
CREATE POLICY "Users can delete own clients"
    ON clients FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- PROJECTS POLICIES
-- -----------------------------------------------------

-- Policy: Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- TASKS POLICIES
-- -----------------------------------------------------

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- INVOICES POLICIES
-- -----------------------------------------------------

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own invoices
CREATE POLICY "Users can insert own invoices"
    ON invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own invoices
CREATE POLICY "Users can update own invoices"
    ON invoices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own invoices
CREATE POLICY "Users can delete own invoices"
    ON invoices FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_clients', (SELECT COUNT(*) FROM clients WHERE user_id = p_user_id),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE user_id = p_user_id AND status = 'in_progress'),
        'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE user_id = p_user_id AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE user_id = p_user_id AND status = 'sent'),
        'total_tasks', (SELECT COUNT(*) FROM tasks WHERE user_id = p_user_id),
        'completed_tasks', (SELECT COUNT(*) FROM tasks WHERE user_id = p_user_id AND status = 'done')
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;

-- =====================================================
-- 6. CREATE SAMPLE/SEED DATA (OPTIONAL)
-- =====================================================
-- Uncomment if you want to create sample data for testing
-- Note: This requires a valid user_id from auth.users

/*
-- Insert sample client (replace 'YOUR-USER-ID' with actual user ID)
INSERT INTO clients (user_id, name, email, phone, company)
VALUES 
    ('YOUR-USER-ID', 'John Doe', 'john@example.com', '+1-555-1234', 'Acme Corp'),
    ('YOUR-USER-ID', 'Jane Smith', 'jane@example.com', '+1-555-5678', 'Tech Solutions Inc');

-- Insert sample project
INSERT INTO projects (user_id, client_id, title, status, budget)
VALUES 
    ('YOUR-USER-ID', (SELECT id FROM clients WHERE email = 'john@example.com' LIMIT 1), 
     'Website Redesign', 'in_progress', 5000.00);

-- Insert sample task
INSERT INTO tasks (user_id, project_id, title, status, priority, due_date)
VALUES 
    ('YOUR-USER-ID', (SELECT id FROM projects WHERE title = 'Website Redesign' LIMIT 1),
     'Design homepage mockup', 'todo', 'high', CURRENT_DATE + INTERVAL '7 days');

-- Insert sample invoice
INSERT INTO invoices (user_id, client_id, invoice_number, amount, status, due_date)
VALUES 
    ('YOUR-USER-ID', (SELECT id FROM clients WHERE email = 'john@example.com' LIMIT 1),
     'INV-001', 2500.00, 'sent', CURRENT_DATE + INTERVAL '30 days');
*/

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the setup

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check policies
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Database schema created successfully!
-- 
-- Next steps:
-- 1. Verify all tables are created
-- 2. Verify RLS policies are active
-- 3. Update supabase-config.js with your project credentials
-- 4. Test authentication and CRUD operations
-- =====================================================
