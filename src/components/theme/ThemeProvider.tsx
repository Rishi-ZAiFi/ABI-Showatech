/**
 * Theme Provider Component
 * Wraps application with next-themes for dark mode support
 */

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

interface ThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
