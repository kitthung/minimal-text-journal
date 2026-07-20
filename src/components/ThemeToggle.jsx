import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    // Initial theme check
    const savedScheme = localStorage.getItem('color-scheme');
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedScheme || (systemIsDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    setIsPinned(!!savedScheme);
    
    if (savedScheme) {
      document.documentElement.setAttribute('data-theme', savedScheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Listener for system color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only react if the user hasn't pinned a specific theme
      if (!localStorage.getItem('color-scheme')) {
        const nextTheme = e.matches ? 'dark' : 'light';
        setTheme(nextTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const handleToggle = () => {
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = systemIsDark ? 'dark' : 'light';
    const targetTheme = theme === 'dark' ? 'light' : 'dark';

    if (targetTheme === systemTheme) {
      // Revert to system preferences
      localStorage.removeItem('color-scheme');
      document.documentElement.removeAttribute('data-theme');
      setIsPinned(false);
    } else {
      // Pin user override
      localStorage.setItem('color-scheme', targetTheme);
      document.documentElement.setAttribute('data-theme', targetTheme);
      setIsPinned(true);
    }
    
    setTheme(targetTheme);
  };

  return (
    <button 
      onClick={handleToggle}
      className="btn-icon"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={isPinned ? `Override: ${theme} mode` : 'Following system theme'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
