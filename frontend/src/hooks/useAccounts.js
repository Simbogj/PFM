import { useState, useEffect, useCallback } from 'react';
import { accountsAPI } from '../services/api';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountsAPI.getAll();
      setAccounts(res.data.data.accounts);
      setSummary(res.data.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { accounts, summary, loading, error, refetch: load };
};
