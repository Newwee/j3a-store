'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  // Load from localStorage on mount, defaulting to 'system'
  useEffect(() => {
    try {
      const saved = localStorage.getItem('j3a_theme') as Theme | null;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        setThemeState(saved);
      } else {
        setThemeState('system');
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
      setThemeState('system');
    }
  }, []);

  // Sync class on <html>
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t: 'dark' | 'light') => {
      setResolvedTheme(t);
      if (t === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      }
    };

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('j3a_theme', newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    let next: Theme = 'dark';
    if (theme === 'dark') next = 'light';
    else if (theme === 'light') next = 'system';
    else next = 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
