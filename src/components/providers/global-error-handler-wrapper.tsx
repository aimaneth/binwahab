'use client';

import { ReactNode } from 'react';
import { GlobalErrorHandler } from './global-error-handler';

interface GlobalErrorHandlerWrapperProps {
  children: ReactNode;
}

export function GlobalErrorHandlerWrapper({ children }: GlobalErrorHandlerWrapperProps) {
  return (
    <>
      <GlobalErrorHandler />
      {children}
    </>
  );
}

export default GlobalErrorHandlerWrapper; 