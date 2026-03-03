import { useState, useEffect } from 'react';

/**
 * Optimized currency formatter instance to avoid repeated creation
 */
export const currencyFormatter = new Intl.NumberFormat('pt-MZ', {
  style: 'currency',
  currency: 'MZN',
  minimumFractionDigits: 2
});

/**
 * Standard data-fns locale is used, but for raw JS formatting:
 */
export const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

export const timeFormatter = new Intl.DateTimeFormat('pt-PT', {
  hour: '2-digit',
  minute: '2-digit'
});

export const formatCurrency = (value) => currencyFormatter.format(value || 0);

/**
 * Hook to debounce state values
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
