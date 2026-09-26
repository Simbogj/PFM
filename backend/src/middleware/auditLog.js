const { query } = require('../config/database');

const auditLog = (action, tableName) => async (req, res, next) => {
  // Store original json method to intercept response
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (body && body.success && req.user) {
      try {
        await query(
          `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user.id,
            action,
            tableName,
            body.data?.id || null,
            JSON.stringify(body.data || {}),
            req.ip,
            req.get('User-Agent') || '',
          ]
        );
      } catch (err) {
        // Don't fail the request if audit logging fails
        console.error('Audit log error:', err.message);
      }
    }
    return originalJson(body);
  };

  next();
};

module.exports = { auditLog };
