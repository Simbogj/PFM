import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageLoader } from './components/ui/LoadingSpinner';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App pages
import DashboardPage from './pages/dashboard/DashboardPage';
import AccountsPage from './pages/accounts/AccountsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import IncomePage from './pages/income/IncomePage';
import ExpensesPage from './pages/expenses/ExpensesPage';
import TransfersPage from './pages/transfers/TransfersPage';
import SavingsPage from './pages/savings/SavingsPage';
import LendingPage from './pages/lending/LendingPage';
import BorrowingPage from './pages/borrowing/BorrowingPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import GoalsPage from './pages/goals/GoalsPage';
import ReportsPage from './pages/reports/ReportsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import SettingsPage from './pages/settings/SettingsPage';

// Guard that redirects to /login if not authenticated
const RequireAuth = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;  // renders <Outlet /> inside
};

// Guard that redirects to / if already authenticated
const RequireGuest = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<RequireGuest><LoginPage /></RequireGuest>} />
    <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

    {/* Protected — AppLayout contains <Outlet /> */}
    <Route element={<RequireAuth />}>
      <Route path="/"            element={<DashboardPage />} />
      <Route path="/accounts"    element={<AccountsPage />} />
      <Route path="/transactions"element={<TransactionsPage />} />
      <Route path="/income"      element={<IncomePage />} />
      <Route path="/expenses"    element={<ExpensesPage />} />
      <Route path="/transfers"   element={<TransfersPage />} />
      <Route path="/savings"     element={<SavingsPage />} />
      <Route path="/lending"     element={<LendingPage />} />
      <Route path="/borrowing"   element={<BorrowingPage />} />
      <Route path="/payments"    element={<PaymentsPage />} />
      <Route path="/budgets"     element={<BudgetsPage />} />
      <Route path="/goals"       element={<GoalsPage />} />
      <Route path="/reports"     element={<ReportsPage />} />
      <Route path="/calendar"    element={<CalendarPage />} />
      <Route path="/settings"    element={<SettingsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
