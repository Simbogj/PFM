# Personal Finance Manager (PFM)

A full-stack personal money management system for tracking all your finances in one place.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router, React Hook Form |
| Backend | Node.js, Express.js, JWT Auth, bcrypt |
| Database | PostgreSQL |
| Icons | Lucide React |

---

## Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** v9+

---

## Quick Start

### 1. Clone and install

```bash
cd f:/PFM
npm install --prefix backend
npm install --prefix frontend
```

### 2. Setup PostgreSQL database

Create a database named `pfm_db`:

```sql
CREATE DATABASE pfm_db;
```

### 3. Configure environment

Edit `backend/.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pfm_db
JWT_SECRET=your_very_long_random_secret_here
JWT_REFRESH_SECRET=another_long_random_secret_here
```

### 4. Run migrations and seed data

```bash
npm run migrate   # Creates all tables
npm run seed      # Loads demo data
```

### 5. Start the application

Open two terminals:

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Demo Login
- **Email:** `demo@pfm.com`
- **Password:** `Demo@1234`

---

## Features

### Accounts
- Multiple account types: Bank, Savings, Cash, Mobile Money, Investment, Credit Card
- Real-time balance tracking
- Account reconciliation with audit trail
- Color-coded account cards

### Transactions
- Full ledger with all transaction types
- Income, Expense, Transfer, Withdrawal, Deposit
- Lending, Borrowing, Loan Repayment, Savings Deposit
- Search, filter, and paginate

### Income & Salary
- Record any income with categories
- Dedicated salary entry with gross/tax/deductions/net calculation

### Expenses
- Categorized expenses with pie chart breakdown
- Receipt attachment support

### Transfers
- Bank-to-bank transfers (NOT counted as income/expense)
- Transfer fee tracking
- CBE → BOA, Bank → Cash, Cash → Savings, etc.

### Savings Goals
- Create goals with targets and deadlines
- Deposit/Withdraw to goals
- Progress tracking

### Lending (Money you give)
- Track loans to others with interest
- Record partial/full repayments
- Overdue tracking

### Borrowing (Money you receive)
- Track loans from others
- Repayment schedule
- Outstanding balance tracking

### Payments & Bills
- Recurring bill tracking
- Mark as paid with account deduction
- Overdue alerts

### Budgets
- Monthly category budgets
- Overspend alerts at 80%, 90%, 100%

### Financial Goals
- Goals with target dates and monthly contributions
- Automatic required monthly calculation

### Reports
- Cash Flow Report (Opening → Inflow → Outflow → Closing)
- Net Worth Report (Assets − Liabilities)
- 6-Month summary table
- Export to CSV

### Calendar
- Visual calendar with all financial events
- Color-coded by type (income, expense, bill due, loan due)

### Dashboard
- Total balance, monthly income/expenses
- Net worth, owed to me, I owe others
- Quick action buttons for common tasks
- Income vs Expenses bar chart
- Expense by category pie chart
- Net worth trend chart
- Recent transactions
- Upcoming payments

---

## Accounting Logic

This system correctly distinguishes:

| Action | Effect |
|---|---|
| Salary/Income | Account ↑ |
| Expense/Payment | Account ↓ |
| Transfer (Bank→Bank) | From ↓, To ↑ (net zero) |
| Withdrawal (Bank→Cash) | Bank ↓, Cash ↑ |
| Savings Deposit | Spending account ↓, Savings ↑ |
| Lending | Account ↓, Receivable ↑ |
| Borrowing | Account ↑, Liability ↑ |
| Loan Repayment | Account ↓, Liability ↓ |
| Lending Repayment | Account ↑, Receivable ↓ |

Transfers never inflate income or expense totals.

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/change-password

GET    /api/dashboard

GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/accounts/:id/transactions
POST   /api/accounts/:id/reconcile

GET    /api/transactions
POST   /api/transactions
DELETE /api/transactions/:id
GET    /api/transactions/categories
POST   /api/transactions/categories

GET    /api/transfers
POST   /api/transfers
DELETE /api/transfers/:id

GET    /api/income
POST   /api/income
POST   /api/income/salary
GET    /api/income/salary

GET    /api/expenses
POST   /api/expenses
DELETE /api/expenses/:id
GET    /api/expenses/by-category

GET    /api/savings
POST   /api/savings
PUT    /api/savings/:id
DELETE /api/savings/:id
POST   /api/savings/:id/deposit
POST   /api/savings/:id/withdraw

GET    /api/lendings
POST   /api/lendings
PUT    /api/lendings/:id
POST   /api/lendings/:id/payment

GET    /api/borrowings
POST   /api/borrowings
PUT    /api/borrowings/:id
POST   /api/borrowings/:id/repay

GET    /api/payments
POST   /api/payments
PUT    /api/payments/:id
POST   /api/payments/:id/pay
DELETE /api/payments/:id

GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id

GET    /api/goals
POST   /api/goals
PUT    /api/goals/:id
DELETE /api/goals/:id

GET    /api/reports/cash-flow
GET    /api/reports/net-worth
GET    /api/reports/monthly-summary
GET    /api/reports/account-statement
GET    /api/reports/calendar-events
```

---

## Project Structure

```
PFM/
├── backend/
│   ├── src/
│   │   ├── app.js               # Express app
│   │   ├── server.js            # Entry point
│   │   ├── config/              # Database, JWT config
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Auth, validation, error handling
│   │   ├── validators/          # Input validation rules
│   │   ├── utils/               # Response helpers, formatters
│   │   └── db/                  # Migration & seed runners
│   ├── .env                     # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router
│   │   ├── main.jsx             # Entry point
│   │   ├── context/             # Auth, Theme context
│   │   ├── services/            # Axios API layer
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Formatters
│   │   ├── components/
│   │   │   ├── ui/              # Button, Card, Modal, Badge, etc.
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   ├── forms/           # AccountSelect, CategorySelect
│   │   │   └── layout/          # Sidebar, Topbar, AppLayout
│   │   └── pages/               # All 15 pages
│   └── package.json
├── database/
│   ├── migrations/              # SQL schema
│   └── seeds/                   # Demo data
└── README.md
```

---

## Security

- JWT authentication with refresh tokens
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min general, 20 req/15min auth)
- Helmet.js security headers
- CORS protection
- SQL injection protection via parameterized queries
- Input validation via express-validator
- Audit logging for reconciliations
- Account numbers masked (last 4 digits only)

---

## Default Currency

ETB (Ethiopian Birr). Change via Settings → Profile → Currency.
