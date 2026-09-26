import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, TrendingUp, TrendingDown,
  Send, PiggyBank, Coins, CreditCard, CalendarClock,
  Target, BarChart3, Calendar, Settings, ChevronLeft, ChevronRight,
  DollarSign, Repeat, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { label: 'Dashboard',    path: '/',            icon: LayoutDashboard },
  { label: 'Accounts',     path: '/accounts',    icon: Wallet },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Income',       path: '/income',      icon: TrendingUp },
  { label: 'Expenses',     path: '/expenses',    icon: TrendingDown },
  { label: 'Transfers',    path: '/transfers',   icon: Send },
  { label: 'Savings',      path: '/savings',     icon: PiggyBank },
  { label: 'Lending',      path: '/lending',     icon: Coins },
  { label: 'Borrowing',    path: '/borrowing',   icon: DollarSign },
  { label: 'Payments',     path: '/payments',    icon: CalendarClock },
  { label: 'Budgets',      path: '/budgets',     icon: CreditCard },
  { label: 'Goals',        path: '/goals',       icon: Target },
  { label: 'Reports',      path: '/reports',     icon: BarChart3 },
  { label: 'Calendar',     path: '/calendar',    icon: Calendar },
  { label: 'Settings',     path: '/settings',    icon: Settings },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 h-screen sticky top-0 flex flex-col bg-gray-900 dark:bg-gray-950 text-white transition-all duration-300 z-30`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700/50">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-white truncate">PFM</p>
            <p className="text-xs text-gray-400 truncate">Finance Manager</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ label, path, icon: Icon }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/60'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-700/50 px-2 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {user?.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-700/60 w-full transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
