'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/fetcher';

export function SWRProvider({ children }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
