export const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const getStoredTheme = () => {
  return getSystemTheme();
};

export const applyTheme = () => {
  try {
    const isDark = getSystemTheme() === 'dark';
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Clear any legacy manual preferences to ensure device system theme is always active
    localStorage.removeItem('theme_preference');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    window.dispatchEvent(new CustomEvent('theme_changed', {
      detail: {
        theme: isDark ? 'dark' : 'light',
        isSystem: true
      }
    }));
  } catch (e) {}
};

let isListenerAttached = false;

export const initTheme = () => {
  // Apply immediately
  applyTheme();

  if (typeof window !== 'undefined' && !isListenerAttached) {
    isListenerAttached = true;

    const handleSystemThemeChange = () => {
      applyTheme();
    };

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } catch (e) {
        try {
          mediaQuery.addListener(handleSystemThemeChange);
        } catch (err) {}
      }
    }

    // On mobile devices (iOS / Android), when users switch themes in system settings and return to browser
    window.addEventListener('focus', handleSystemThemeChange);
    window.addEventListener('pageshow', handleSystemThemeChange);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleSystemThemeChange();
      }
    });
  }

  return getSystemTheme();
};
