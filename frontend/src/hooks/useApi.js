import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook.
 * @param {Function} fetchFn - async function returning an axios response
 * @param {any[]} deps - dependency array
 * @param {object} opts - { immediate: true }
 */
export const useApi = (fetchFn, deps = [], opts = { immediate: true }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(opts.immediate !== false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (opts.immediate !== false) execute();
  }, [execute]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: execute, setData };
};

/**
 * Mutation hook for POST/PUT/DELETE.
 */
export const useMutation = (mutateFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutateFn(data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error, setError };
};
