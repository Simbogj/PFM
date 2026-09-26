-- ============================================================
-- PERSONAL FINANCE MANAGER - COMPLETE DATABASE SCHEMA
-- Migration 001: Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'ETB',
    timezone VARCHAR(100) DEFAULT 'Africa/Addis_Ababa',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    language VARCHAR(20) DEFAULT 'en',
    notify_upcoming_bills BOOLEAN DEFAULT TRUE,
    notify_overdue_payments BOOLEAN DEFAULT TRUE,
    notify_budget_exceeded BOOLEAN DEFAULT TRUE,
    notify_low_balance BOOLEAN DEFAULT TRUE,
    low_balance_threshold NUMERIC(15,2) DEFAULT 1000.00,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- ACCOUNT TYPES & ACCOUNTS
-- ============================================================

CREATE TABLE account_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_asset BOOLEAN DEFAULT TRUE,
    is_liability BOOLEAN DEFAULT FALSE,
    description VARCHAR(255)
);

INSERT INTO account_types (name, code, is_asset, is_liability) VALUES
    ('Bank Account', 'BANK', TRUE, FALSE),
    ('Savings Account', 'SAVINGS', TRUE, FALSE),
    ('Cash Wallet', 'CASH', TRUE, FALSE),
    ('Mobile Money', 'MOBILE_MONEY', TRUE, FALSE),
    ('Investment Account', 'INVESTMENT', TRUE, FALSE),
    ('Credit Card', 'CREDIT_CARD', FALSE, TRUE),
    ('Other', 'OTHER', TRUE, FALSE);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type_code VARCHAR(50) NOT NULL REFERENCES account_types(code),
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    account_number_last4 VARCHAR(4),
    currency VARCHAR(10) DEFAULT 'ETB',
    opening_balance NUMERIC(15,2) DEFAULT 0.00,
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'building-2',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    is_default BOOLEAN DEFAULT FALSE,
    include_in_total BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = system category
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'saving', 'investment')),
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES categories(id),
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System income categories
INSERT INTO categories (id, name, type, icon, color, is_system) VALUES
    (uuid_generate_v4(), 'Salary', 'income', 'briefcase', '#10B981', TRUE),
    (uuid_generate_v4(), 'Freelance', 'income', 'laptop', '#3B82F6', TRUE),
    (uuid_generate_v4(), 'Business', 'income', 'building', '#8B5CF6', TRUE),
    (uuid_generate_v4(), 'Bonus', 'income', 'gift', '#F59E0B', TRUE),
    (uuid_generate_v4(), 'Commission', 'income', 'percent', '#EC4899', TRUE),
    (uuid_generate_v4(), 'Interest', 'income', 'trending-up', '#06B6D4', TRUE),
    (uuid_generate_v4(), 'Investment Income', 'income', 'bar-chart', '#6366F1', TRUE),
    (uuid_generate_v4(), 'Gift Received', 'income', 'heart', '#F43F5E', TRUE),
    (uuid_generate_v4(), 'Refund', 'income', 'rotate-ccw', '#84CC16', TRUE),
    (uuid_generate_v4(), 'Other Income', 'income', 'plus-circle', '#6B7280', TRUE);

-- System expense categories
INSERT INTO categories (id, name, type, icon, color, is_system) VALUES
    (uuid_generate_v4(), 'Housing', 'expense', 'home', '#EF4444', TRUE),
    (uuid_generate_v4(), 'Food & Dining', 'expense', 'utensils', '#F97316', TRUE),
    (uuid_generate_v4(), 'Transportation', 'expense', 'car', '#EAB308', TRUE),
    (uuid_generate_v4(), 'Utilities', 'expense', 'zap', '#22C55E', TRUE),
    (uuid_generate_v4(), 'Internet', 'expense', 'wifi', '#06B6D4', TRUE),
    (uuid_generate_v4(), 'Phone', 'expense', 'smartphone', '#8B5CF6', TRUE),
    (uuid_generate_v4(), 'Education', 'expense', 'book-open', '#3B82F6', TRUE),
    (uuid_generate_v4(), 'Healthcare', 'expense', 'heart-pulse', '#EC4899', TRUE),
    (uuid_generate_v4(), 'Clothing', 'expense', 'shirt', '#A78BFA', TRUE),
    (uuid_generate_v4(), 'Entertainment', 'expense', 'tv', '#FB923C', TRUE),
    (uuid_generate_v4(), 'Shopping', 'expense', 'shopping-bag', '#F472B6', TRUE),
    (uuid_generate_v4(), 'Family', 'expense', 'users', '#34D399', TRUE),
    (uuid_generate_v4(), 'Travel', 'expense', 'plane', '#38BDF8', TRUE),
    (uuid_generate_v4(), 'Subscriptions', 'expense', 'repeat', '#818CF8', TRUE),
    (uuid_generate_v4(), 'Debt Repayment', 'expense', 'credit-card', '#F87171', TRUE),
    (uuid_generate_v4(), 'Bank Fees', 'expense', 'building-2', '#94A3B8', TRUE),
    (uuid_generate_v4(), 'Business Expense', 'expense', 'briefcase', '#64748B', TRUE),
    (uuid_generate_v4(), 'Other Expense', 'expense', 'more-horizontal', '#6B7280', TRUE);

-- ============================================================
-- TRANSACTIONS (Central Ledger)
-- ============================================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'income', 'expense', 'transfer', 'withdrawal', 'deposit',
        'payment', 'lending', 'loan_received', 'loan_repayment',
        'lending_repayment', 'savings_deposit', 'savings_withdrawal',
        'investment', 'refund', 'adjustment'
    )),
    account_id UUID NOT NULL REFERENCES accounts(id),
    destination_account_id UUID REFERENCES accounts(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    fee_amount NUMERIC(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'ETB',
    category_id UUID REFERENCES categories(id),
    date DATE NOT NULL,
    description VARCHAR(500),
    reference VARCHAR(255),
    payee_payer VARCHAR(255),
    payment_method VARCHAR(50) DEFAULT 'bank' CHECK (payment_method IN (
        'bank', 'cash', 'mobile_money', 'card', 'cheque', 'other'
    )),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN (
        'pending', 'completed', 'cancelled', 'failed'
    )),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_id UUID,
    tags TEXT[],
    notes TEXT,
    attachment_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SALARY RECORDS
-- ============================================================

CREATE TABLE salary_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    employer VARCHAR(255) NOT NULL,
    salary_month DATE NOT NULL,
    gross_salary NUMERIC(15,2) NOT NULL,
    income_tax NUMERIC(15,2) DEFAULT 0.00,
    pension_deduction NUMERIC(15,2) DEFAULT 0.00,
    other_deductions NUMERIC(15,2) DEFAULT 0.00,
    net_salary NUMERIC(15,2) NOT NULL,
    payment_account_id UUID REFERENCES accounts(id),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSFERS
-- ============================================================

CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    fee_amount NUMERIC(15,2) DEFAULT 0.00,
    fee_account_id UUID REFERENCES accounts(id),
    currency VARCHAR(10) DEFAULT 'ETB',
    transfer_date DATE NOT NULL,
    reference VARCHAR(255),
    description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    from_transaction_id UUID REFERENCES transactions(id),
    to_transaction_id UUID REFERENCES transactions(id),
    fee_transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVINGS GOALS
-- ============================================================

CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'ETB',
    target_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    icon VARCHAR(50) DEFAULT 'piggy-bank',
    color VARCHAR(7) DEFAULT '#10B981',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE savings_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LENDING (Money you give to others)
-- ============================================================

CREATE TABLE lendings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    borrower_name VARCHAR(255) NOT NULL,
    borrower_phone VARCHAR(50),
    borrower_email VARCHAR(255),
    principal_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0.00,
    interest_amount NUMERIC(15,2) DEFAULT 0.00,
    total_expected NUMERIC(15,2) NOT NULL,
    amount_paid NUMERIC(15,2) DEFAULT 0.00,
    remaining_balance NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    lend_date DATE NOT NULL,
    due_date DATE,
    purpose VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'partially_paid', 'fully_paid', 'overdue', 'cancelled'
    )),
    transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lending_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lending_id UUID NOT NULL REFERENCES lendings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    notes TEXT,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BORROWING (Money you receive from others)
-- ============================================================

CREATE TABLE borrowings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    lender_name VARCHAR(255) NOT NULL,
    lender_phone VARCHAR(50),
    lender_email VARCHAR(255),
    principal_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0.00,
    interest_amount NUMERIC(15,2) DEFAULT 0.00,
    total_payable NUMERIC(15,2) NOT NULL,
    amount_repaid NUMERIC(15,2) DEFAULT 0.00,
    remaining_balance NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    borrow_date DATE NOT NULL,
    due_date DATE,
    purpose VARCHAR(500),
    repayment_frequency VARCHAR(20) CHECK (repayment_frequency IN (
        'one_time', 'weekly', 'monthly', 'quarterly', 'yearly'
    )),
    monthly_payment NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'partially_repaid', 'fully_repaid', 'overdue', 'cancelled'
    )),
    transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE borrowing_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    principal_portion NUMERIC(15,2) DEFAULT 0.00,
    interest_portion NUMERIC(15,2) DEFAULT 0.00,
    payment_date DATE NOT NULL,
    notes TEXT,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS / BILLS
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_name VARCHAR(255) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'bill' CHECK (payment_type IN (
        'rent', 'electricity', 'water', 'internet', 'phone',
        'loan_repayment', 'subscription', 'school_fees', 'insurance',
        'credit_card', 'bill', 'other'
    )),
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    account_id UUID REFERENCES accounts(id),
    due_date DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(20) CHECK (frequency IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    )),
    next_due_date DATE,
    reminder_days INTEGER DEFAULT 3,
    payee VARCHAR(255),
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN (
        'upcoming', 'due_today', 'paid', 'overdue', 'cancelled'
    )),
    paid_date DATE,
    paid_amount NUMERIC(15,2),
    transaction_id UUID REFERENCES transactions(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    budget_type VARCHAR(20) DEFAULT 'monthly' CHECK (budget_type IN ('monthly', 'annual', 'custom')),
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    alert_at_80 BOOLEAN DEFAULT TRUE,
    alert_at_90 BOOLEAN DEFAULT TRUE,
    alert_at_100 BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL GOALS
-- ============================================================

CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) DEFAULT 'savings' CHECK (goal_type IN (
        'savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'other'
    )),
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'ETB',
    target_date DATE,
    monthly_contribution NUMERIC(15,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    icon VARCHAR(50) DEFAULT 'target',
    color VARCHAR(7) DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECURRING TRANSACTIONS
-- ============================================================

CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    destination_account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    description VARCHAR(500),
    payee_payer VARCHAR(255),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN (
        'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
    )),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    last_generated_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    auto_create BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTACHMENTS
-- ============================================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Accounts
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type_code);
CREATE INDEX idx_accounts_status ON accounts(status);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date_user ON transactions(user_id, date DESC);

-- Transfers
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

-- Lendings
CREATE INDEX idx_lendings_user_id ON lendings(user_id);
CREATE INDEX idx_lendings_status ON lendings(status);

-- Borrowings
CREATE INDEX idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX idx_borrowings_status ON borrowings(status);

-- Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_status ON payments(status);

-- Budgets
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salary_records_updated_at BEFORE UPDATE ON salary_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lendings_updated_at BEFORE UPDATE ON lendings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_borrowings_updated_at BEFORE UPDATE ON borrowings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
