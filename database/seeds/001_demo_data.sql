-- ============================================================
-- DEMO SEED DATA
-- Default password for demo user: Demo@1234
-- bcrypt hash of 'Demo@1234'
-- ============================================================

-- Demo User
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, email_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'demo@pfm.com',
    '$2b$12$TFSSwsWwp68qKsoYbYI4k.Rzt.D1o7g3w30aLjql8L0SghSFm6xjy',
    'Demo',
    'User',
    TRUE,
    TRUE
);

-- Profile
INSERT INTO profiles (user_id, currency, timezone)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'ETB',
    'Africa/Addis_Ababa'
);

-- ============================================================
-- DEMO ACCOUNTS
-- ============================================================

INSERT INTO accounts (id, user_id, account_type_code, account_name, bank_name, account_number_last4, currency, opening_balance, current_balance, color, icon, is_default)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BANK', 'CBE Checking', 'Commercial Bank of Ethiopia', '4521', 'ETB', 50000.00, 58000.00, '#1D4ED8', 'building-2', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BANK', 'BOA Account', 'Bank of Abyssinia', '7832', 'ETB', 20000.00, 22000.00, '#7C3AED', 'building-2', FALSE),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BANK', 'Dashen Bank', 'Dashen Bank', '1199', 'ETB', 10000.00, 10000.00, '#0F766E', 'building-2', FALSE),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'CASH', 'Cash Wallet', NULL, NULL, 'ETB', 5000.00, 8000.00, '#D97706', 'wallet', FALSE),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'SAVINGS', 'Emergency Savings', 'Commercial Bank of Ethiopia', '9988', 'ETB', 20000.00, 35000.00, '#059669', 'piggy-bank', FALSE),
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'MOBILE_MONEY', 'Telebirr', 'Telebirr', NULL, 'ETB', 0.00, 1500.00, '#2563EB', 'smartphone', FALSE);

-- ============================================================
-- DEMO CATEGORIES (user-specific copies not needed; system ones used)
-- ============================================================

-- ============================================================
-- DEMO TRANSACTIONS (last 3 months)
-- ============================================================

-- September 2026 Salary
INSERT INTO transactions (id, user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
SELECT
    uuid_generate_v4(),
    'a0000000-0000-0000-0000-000000000001',
    'income',
    'b0000000-0000-0000-0000-000000000001',
    30000.00,
    'ETB',
    '2026-09-05',
    'September 2026 Salary',
    'Employer',
    'completed'
;

-- Rent payment
INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 10000.00, 'ETB', '2026-09-02', 'Monthly Rent', 'Landlord', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 2500.00, 'ETB', '2026-09-08', 'Grocery Shopping', 'Supermarket', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000004', 800.00, 'ETB', '2026-09-10', 'Taxi / Transport', 'Ride Share', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 1200.00, 'ETB', '2026-09-12', 'Electricity Bill', 'EEPCO', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 600.00, 'ETB', '2026-09-14', 'Internet Bill', 'Ethio Telecom', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 450.00, 'ETB', '2026-09-15', 'Phone Bill', 'Ethio Telecom', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000004', 1800.00, 'ETB', '2026-09-18', 'Restaurant Dinner', 'Kategna Restaurant', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 3500.00, 'ETB', '2026-09-20', 'Clothing Purchase', 'Zara', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 500.00, 'ETB', '2026-09-22', 'Netflix Subscription', 'Netflix', 'completed');

-- August 2026 Salary
INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'income', 'b0000000-0000-0000-0000-000000000001', 30000.00, 'ETB', '2026-08-05', 'August 2026 Salary', 'Employer', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 10000.00, 'ETB', '2026-08-02', 'Monthly Rent', 'Landlord', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 2800.00, 'ETB', '2026-08-10', 'Grocery Shopping', 'Supermarket', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000004', 600.00, 'ETB', '2026-08-15', 'Taxi / Transport', 'Ride Share', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 1200.00, 'ETB', '2026-08-12', 'Electricity Bill', 'EEPCO', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'income', 'b0000000-0000-0000-0000-000000000001', 5000.00, 'ETB', '2026-08-20', 'Freelance Project', 'Client', 'completed');

-- July 2026
INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'income', 'b0000000-0000-0000-0000-000000000001', 30000.00, 'ETB', '2026-07-05', 'July 2026 Salary', 'Employer', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 10000.00, 'ETB', '2026-07-02', 'Monthly Rent', 'Landlord', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'expense', 'b0000000-0000-0000-0000-000000000001', 3200.00, 'ETB', '2026-07-15', 'Grocery Shopping', 'Supermarket', 'completed'),
    ('a0000000-0000-0000-0000-000000000001', 'income', 'b0000000-0000-0000-0000-000000000002', 8000.00, 'ETB', '2026-07-25', 'Business Income', 'Business Client', 'completed');

-- ============================================================
-- DEMO SAVINGS GOALS
-- ============================================================

INSERT INTO savings_goals (id, user_id, account_id, name, description, target_amount, current_amount, currency, target_date, priority, status, icon, color)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Emergency Fund', '6 months of expenses', 100000.00, 35000.00, 'ETB', '2027-06-30', 'high', 'active', 'shield', '#059669'),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', NULL, 'New Laptop', 'MacBook Pro for work', 80000.00, 20000.00, 'ETB', '2026-12-31', 'medium', 'active', 'laptop', '#3B82F6'),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', NULL, 'Vacation - Europe', 'Summer vacation 2027', 150000.00, 10000.00, 'ETB', '2027-06-01', 'low', 'active', 'plane', '#8B5CF6');

-- ============================================================
-- DEMO LENDINGS
-- ============================================================

INSERT INTO lendings (id, user_id, from_account_id, borrower_name, borrower_phone, principal_amount, interest_rate, interest_amount, total_expected, amount_paid, remaining_balance, currency, lend_date, due_date, purpose, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Abebe Girma', '+251911234567', 10000.00, 0.00, 0.00, 10000.00, 3000.00, 7000.00, 'ETB', '2026-08-01', '2026-10-30', 'Personal need', 'partially_paid'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Tigist Alemu', '+251922345678', 5000.00, 0.00, 0.00, 5000.00, 0.00, 5000.00, 'ETB', '2026-09-10', '2026-11-10', 'Business start', 'active');

-- ============================================================
-- DEMO BORROWINGS
-- ============================================================

INSERT INTO borrowings (id, user_id, to_account_id, lender_name, lender_phone, principal_amount, interest_rate, interest_amount, total_payable, amount_repaid, remaining_balance, currency, borrow_date, due_date, purpose, repayment_frequency, monthly_payment, status)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Family Member', '+251933456789', 20000.00, 0.00, 0.00, 20000.00, 4000.00, 16000.00, 'ETB', '2026-06-01', '2027-06-01', 'Home renovation', 'monthly', 2000.00, 'partially_repaid');

-- ============================================================
-- DEMO PAYMENTS / BILLS
-- ============================================================

INSERT INTO payments (user_id, payment_name, payment_type, amount, currency, account_id, is_recurring, frequency, next_due_date, reminder_days, payee, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Monthly Rent', 'rent', 10000.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-02', 5, 'Landlord', 'upcoming'),
    ('a0000000-0000-0000-0000-000000000001', 'Electricity', 'electricity', 1200.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-10', 3, 'EEPCO', 'upcoming'),
    ('a0000000-0000-0000-0000-000000000001', 'Internet', 'internet', 600.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-14', 3, 'Ethio Telecom', 'upcoming'),
    ('a0000000-0000-0000-0000-000000000001', 'Phone Bill', 'phone', 450.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-15', 2, 'Ethio Telecom', 'upcoming'),
    ('a0000000-0000-0000-0000-000000000001', 'Netflix', 'subscription', 500.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-22', 2, 'Netflix', 'upcoming'),
    ('a0000000-0000-0000-0000-000000000001', 'Loan Repayment', 'loan_repayment', 2000.00, 'ETB', 'b0000000-0000-0000-0000-000000000001', TRUE, 'monthly', '2026-10-01', 5, 'Family Member', 'upcoming');

-- ============================================================
-- DEMO BUDGETS (September 2026)
-- ============================================================

INSERT INTO budgets (user_id, name, budget_type, amount, currency, period_start, period_end, is_active)
SELECT
    'a0000000-0000-0000-0000-000000000001',
    c.name || ' Budget',
    'monthly',
    CASE c.name
        WHEN 'Housing' THEN 12000.00
        WHEN 'Food & Dining' THEN 8000.00
        WHEN 'Transportation' THEN 4000.00
        WHEN 'Utilities' THEN 2500.00
        WHEN 'Internet' THEN 700.00
        WHEN 'Phone' THEN 500.00
        WHEN 'Entertainment' THEN 2000.00
        WHEN 'Clothing' THEN 3000.00
        WHEN 'Subscriptions' THEN 1000.00
        ELSE 2000.00
    END,
    'ETB',
    '2026-09-01',
    '2026-09-30',
    TRUE
FROM categories c
WHERE c.is_system = TRUE AND c.type = 'expense'
  AND c.name IN ('Housing','Food & Dining','Transportation','Utilities','Internet','Phone','Entertainment','Clothing','Subscriptions');

-- ============================================================
-- DEMO FINANCIAL GOALS
-- ============================================================

INSERT INTO financial_goals (user_id, name, description, goal_type, target_amount, current_amount, currency, target_date, monthly_contribution, priority, status, icon, color)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Emergency Fund', 'Build 6-month expense buffer', 'emergency_fund', 100000.00, 35000.00, 'ETB', '2027-06-30', 8000.00, 'high', 'active', 'shield', '#059669'),
    ('a0000000-0000-0000-0000-000000000001', 'New Laptop', 'MacBook Pro for development', 'purchase', 80000.00, 20000.00, 'ETB', '2026-12-31', 15000.00, 'medium', 'active', 'laptop', '#3B82F6'),
    ('a0000000-0000-0000-0000-000000000001', 'House Down Payment', 'Save for future home purchase', 'savings', 500000.00, 0.00, 'ETB', '2030-01-01', 10000.00, 'low', 'active', 'home', '#8B5CF6');
