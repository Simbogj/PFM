const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { success, created, error } = require('../utils/response');

const SALT_ROUNDS = 12;

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return error(res, 'Email already registered', 409);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, email, first_name, last_name, created_at`,
      [email, password_hash, first_name, last_name]
    );

    const user = result.rows[0];

    // Create default profile
    await query(
      `INSERT INTO profiles (user_id, currency, timezone) VALUES ($1, $2, $3)`,
      [user.id, 'ETB', 'Africa/Addis_Ababa']
    );

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return created(res, {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      accessToken,
      refreshToken,
    }, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.is_active,
              p.currency, p.timezone, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (!result.rows.length) {
      return error(res, 'Invalid email or password', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return error(res, 'Account is deactivated', 403);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        currency: user.currency,
        timezone: user.timezone,
        avatar_url: user.avatar_url,
      },
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return error(res, 'Refresh token required', 401);

    const decoded = verifyRefreshToken(token);
    const result = await query(
      'SELECT id, email, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return error(res, 'Invalid refresh token', 401);
    }

    const user = result.rows[0];
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id });

    return success(res, { accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Refresh token expired, please login again', 401);
    }
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
              p.currency, p.timezone, p.date_format, p.language,
              p.notify_upcoming_bills, p.notify_overdue_payments,
              p.notify_budget_exceeded, p.notify_low_balance,
              p.low_balance_threshold, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const {
      first_name, last_name,
      currency, timezone, date_format, language,
      notify_upcoming_bills, notify_overdue_payments,
      notify_budget_exceeded, notify_low_balance,
      low_balance_threshold,
    } = req.body;

    if (first_name || last_name) {
      await query(
        `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name)
         WHERE id = $3`,
        [first_name, last_name, req.user.id]
      );
    }

    await query(
      `INSERT INTO profiles (user_id, currency, timezone, date_format, language,
         notify_upcoming_bills, notify_overdue_payments, notify_budget_exceeded,
         notify_low_balance, low_balance_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         currency = COALESCE(EXCLUDED.currency, profiles.currency),
         timezone = COALESCE(EXCLUDED.timezone, profiles.timezone),
         date_format = COALESCE(EXCLUDED.date_format, profiles.date_format),
         language = COALESCE(EXCLUDED.language, profiles.language),
         notify_upcoming_bills = COALESCE(EXCLUDED.notify_upcoming_bills, profiles.notify_upcoming_bills),
         notify_overdue_payments = COALESCE(EXCLUDED.notify_overdue_payments, profiles.notify_overdue_payments),
         notify_budget_exceeded = COALESCE(EXCLUDED.notify_budget_exceeded, profiles.notify_budget_exceeded),
         notify_low_balance = COALESCE(EXCLUDED.notify_low_balance, profiles.notify_low_balance),
         low_balance_threshold = COALESCE(EXCLUDED.low_balance_threshold, profiles.low_balance_threshold),
         updated_at = NOW()`,
      [
        req.user.id, currency, timezone, date_format, language,
        notify_upcoming_bills, notify_overdue_payments,
        notify_budget_exceeded, notify_low_balance, low_balance_threshold,
      ]
    );

    return success(res, null, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return error(res, 'Current password is incorrect', 400);
    }

    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    return success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, getMe, updateProfile, changePassword };
