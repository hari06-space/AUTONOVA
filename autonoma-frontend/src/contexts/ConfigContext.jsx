import PropTypes from 'prop-types';
import { createContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';

// project imports
import config from 'config';
import { useLocalStorage } from 'hooks/useLocalStorage';
import axios from 'utils/axios';

// ==============================|| CONFIG CONTEXT ||============================== //

export const ConfigContext = createContext(undefined);

// ==============================|| CONFIG PROVIDER ||============================== //

export function ConfigProvider({ children }) {
  const { state, setState, setField, resetState } = useLocalStorage('berry-config-vite-js', config);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState(() => localStorage.getItem('theme-mode') || 'system');

  // ── Date & Time Settings (Refinement: ConfigContext is the single source of truth) ──
  // localStorage is the cache — written on login (JWTContext) and on Company Profile save.
  // Components read from context via useConfig(), never from localStorage directly.
  const [dateTimeSettings, setDateTimeSettings] = useState({
    timeFormat: localStorage.getItem('timeFormat') || 'H24',       // 'H24' | 'H12'
    dateFormat: localStorage.getItem('dateFormat') || 'DD/MM/YYYY', // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
    weekStartsOn: localStorage.getItem('weekStartsOn') || 'MONDAY', // 'MONDAY' | 'SUNDAY' | 'SATURDAY'
    timezone: localStorage.getItem('appTimezone') || 'Asia/Kolkata'
  });

  /**
   * updateDateTimeSettings — called after a successful Company Profile save.
   * Updates both the context state (reactive) and the localStorage cache.
   * @param {{ timeFormat, dateFormat, weekStartsOn, timezone }} settings
   */
  const updateDateTimeSettings = useCallback((settings) => {
    setDateTimeSettings((prev) => ({ ...prev, ...settings }));
    // Sync cache
    if (settings.timeFormat !== undefined)   localStorage.setItem('timeFormat',   settings.timeFormat);
    if (settings.dateFormat !== undefined)   localStorage.setItem('dateFormat',   settings.dateFormat);
    if (settings.weekStartsOn !== undefined) localStorage.setItem('weekStartsOn', settings.weekStartsOn);
    if (settings.timezone !== undefined)     localStorage.setItem('appTimezone',  settings.timezone);
  }, []);
  const isInitialMount = useRef(true);
  const prevStateRef = useRef(state);
  const prevModeRef = useRef(currentMode);
  const isDbLoadRef = useRef(false);

  const loadStateFromDb = useCallback(
    (settings) => {
      isDbLoadRef.current = true;
      setState((prev) => ({ ...prev, ...settings }));
    },
    [setState]
  );

  // Monitor DOM attribute changes for theme mode updates
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const mode = localStorage.getItem('theme-mode') || 'system';
      setCurrentMode(mode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isDbLoadRef.current) {
      isDbLoadRef.current = false;
      prevStateRef.current = state;
      prevModeRef.current = currentMode;
      return;
    }
  }, [state, currentMode]);

  // ── Dynamic Font Loading Effect ───────────────────────────────────────────
  // Dynamically imports CSS + woff2 fonts only when configured by the user.
  // All fonts are @fontsource local packages — no CDN/internet needed.
  useEffect(() => {
    if (!state.fontFamily) return;

    const loadFont = async () => {
      const key = state.fontFamily.toLowerCase().replace(/['\s,]/g, '');
      try {
        if      (key.includes('poppins'))          { await Promise.all([import('@fontsource/poppins/400.css'), import('@fontsource/poppins/500.css'), import('@fontsource/poppins/700.css')]); }
        else if (key.includes('inter'))             { await Promise.all([import('@fontsource/inter/400.css'), import('@fontsource/inter/500.css'), import('@fontsource/inter/700.css')]); }
        else if (key.includes('lato'))              { await Promise.all([import('@fontsource/lato/400.css'), import('@fontsource/lato/700.css')]); }
        else if (key.includes('nunitosans'))        { await Promise.all([import('@fontsource/nunito-sans/400.css'), import('@fontsource/nunito-sans/500.css'), import('@fontsource/nunito-sans/700.css')]); }
        else if (key.includes('nunito'))            { await Promise.all([import('@fontsource/nunito/400.css'), import('@fontsource/nunito/500.css'), import('@fontsource/nunito/700.css')]); }
        else if (key.includes('outfit'))            { await Promise.all([import('@fontsource/outfit/400.css'), import('@fontsource/outfit/500.css'), import('@fontsource/outfit/700.css')]); }
        else if (key.includes('publicsans'))        { await Promise.all([import('@fontsource/public-sans/400.css'), import('@fontsource/public-sans/500.css'), import('@fontsource/public-sans/700.css')]); }
        else if (key.includes('plusjakartasans'))   { await Promise.all([import('@fontsource/plus-jakarta-sans/400.css'), import('@fontsource/plus-jakarta-sans/500.css'), import('@fontsource/plus-jakarta-sans/700.css')]); }
        else if (key.includes('montserrat'))        { await Promise.all([import('@fontsource/montserrat/400.css'), import('@fontsource/montserrat/500.css'), import('@fontsource/montserrat/700.css')]); }
        else if (key.includes('raleway'))           { await Promise.all([import('@fontsource/raleway/400.css'), import('@fontsource/raleway/500.css'), import('@fontsource/raleway/700.css')]); }
        else if (key.includes('dmsans'))            { await Promise.all([import('@fontsource/dm-sans/400.css'), import('@fontsource/dm-sans/500.css'), import('@fontsource/dm-sans/700.css')]); }
        else if (key.includes('josefinsans'))       { await Promise.all([import('@fontsource/josefin-sans/400.css'), import('@fontsource/josefin-sans/600.css'), import('@fontsource/josefin-sans/700.css')]); }
        else if (key.includes('worksans'))          { await Promise.all([import('@fontsource/work-sans/400.css'), import('@fontsource/work-sans/500.css'), import('@fontsource/work-sans/700.css')]); }
        else if (key.includes('manrope'))           { await Promise.all([import('@fontsource/manrope/400.css'), import('@fontsource/manrope/500.css'), import('@fontsource/manrope/700.css')]); }
        else if (key.includes('karla'))             { await Promise.all([import('@fontsource/karla/400.css'), import('@fontsource/karla/500.css'), import('@fontsource/karla/700.css')]); }
        else if (key.includes('mulish'))            { await Promise.all([import('@fontsource/mulish/400.css'), import('@fontsource/mulish/500.css'), import('@fontsource/mulish/700.css')]); }
        else if (key.includes('quicksand'))         { await Promise.all([import('@fontsource/quicksand/400.css'), import('@fontsource/quicksand/500.css'), import('@fontsource/quicksand/700.css')]); }
        else if (key.includes('rubik'))             { await Promise.all([import('@fontsource/rubik/400.css'), import('@fontsource/rubik/500.css'), import('@fontsource/rubik/700.css')]); }
        else if (key.includes('barlow'))            { await Promise.all([import('@fontsource/barlow/400.css'), import('@fontsource/barlow/500.css'), import('@fontsource/barlow/700.css')]); }
        else if (key.includes('playfairdisplay'))   { await Promise.all([import('@fontsource/playfair-display/400.css'), import('@fontsource/playfair-display/700.css')]); }
        else if (key.includes('merriweather'))      { await Promise.all([import('@fontsource/merriweather/400.css'), import('@fontsource/merriweather/700.css')]); }
        else if (key.includes('lora'))              { await Promise.all([import('@fontsource/lora/400.css'), import('@fontsource/lora/500.css'), import('@fontsource/lora/700.css')]); }
        else if (key.includes('oswald'))            { await Promise.all([import('@fontsource/oswald/400.css'), import('@fontsource/oswald/500.css'), import('@fontsource/oswald/700.css')]); }
        else if (key.includes('sourcecodepro'))     { await Promise.all([import('@fontsource/source-code-pro/400.css'), import('@fontsource/source-code-pro/500.css'), import('@fontsource/source-code-pro/700.css')]); }
        else if (key.includes('inconsolata'))       { await Promise.all([import('@fontsource/inconsolata/400.css'), import('@fontsource/inconsolata/700.css')]); }
        else if (key.includes('dancingscript'))     { await Promise.all([import('@fontsource/dancing-script/400.css'), import('@fontsource/dancing-script/700.css')]); }
        else if (key.includes('pacifico'))          { await Promise.all([import('@fontsource/pacifico/400.css')]); }
        else if (key.includes('roboto'))            { await Promise.all([import('@fontsource/roboto/400.css'), import('@fontsource/roboto/500.css'), import('@fontsource/roboto/700.css')]); }
      } catch (err) {
        console.warn('[ConfigContext] Failed to dynamically load font family:', state.fontFamily, err);

      }
    };
    loadFont();
  }, [state.fontFamily]);

  useEffect(() => {
    const token = sessionStorage.getItem('serviceToken');
    if (!token) return;

    // Determine what changed
    const changedKeys = [];
    if (currentMode !== prevModeRef.current) {
      changedKeys.push('Theme Mode');
    }

    const formatKey = (k) => {
      // e.g. "menuOrientation" -> "Menu Orientation"
      return k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    };

    Object.keys(state).forEach((key) => {
      if (state[key] !== prevStateRef.current[key]) {
        changedKeys.push(formatKey(key));
      }
    });

    if (changedKeys.length === 0) {
      return; // Nothing changed, don't show message or hit API
    }

    const messageStr = `${changedKeys.join(', ')} Style Saved/Updated Successfully!`;

    // Update refs for next change
    prevStateRef.current = state;
    prevModeRef.current = currentMode;

    const saveToDb = async () => {
      try {
        await axios.post('/api/theme-settings', {
          themeMode: localStorage.getItem('theme-mode') || 'system',
          menuOrientation: state.menuOrientation,
          ribbonLayout: state.ribbonLayout,
          menuCardStyle: state.menuCardStyle,
          miniDrawer: state.miniDrawer,
          fontFamily: state.fontFamily,
          fontSize: state.fontSize,
          borderRadius: state.borderRadius,
          outlinedFilled: state.outlinedFilled,
          presetColor: state.presetColor && state.presetColor.startsWith('custom:') ? 'custom' : state.presetColor,
          customPrimaryColor: state.presetColor && state.presetColor.startsWith('custom:') ? state.presetColor.split(':')[1] : null,
          customSecondaryColor: state.presetColor && state.presetColor.startsWith('custom:') ? state.presetColor.split(':')[2] : null,
          i18n: state.i18n,
          themeDirection: state.themeDirection,
          container: state.container,
          dashboardLayout: state.dashboardLayout || 'glass',
          headerTheme: state.headerTheme || 'default',
          dndMode: state.dndMode,
          allowNotifications: state.allowNotifications,
          notificationRingtone: state.notificationRingtone,
          notificationMapping: typeof state.notificationMapping === 'object' ? JSON.stringify(state.notificationMapping) : state.notificationMapping
        });

        import('store').then(({ dispatch }) => {
          import('store/slices/snackbar').then(({ openSnackbar }) => {
            dispatch(
              openSnackbar({
                open: true,
                message: messageStr,
                variant: 'alert',
                alert: { variant: 'filled' },
                severity: 'success',
                close: false
              })
            );
          });
        });
      } catch (err) {
        console.error('Failed to save theme settings to DB:', err);
      }
    };

    const timer = setTimeout(saveToDb, 1000);
    return () => clearTimeout(timer);
  }, [state, currentMode]);

  const memoizedValue = useMemo(
    () => ({
      state, setState, setField, resetState,
      customizationOpen, setCustomizationOpen,
      loadStateFromDb,
      // Date & Time Settings — read by all components via useConfig()
      timeFormat: dateTimeSettings.timeFormat,       // 'H24' | 'H12'
      dateFormat: dateTimeSettings.dateFormat,       // 'DD/MM/YYYY' etc.
      weekStartsOn: dateTimeSettings.weekStartsOn,   // 'MONDAY' | 'SUNDAY' | 'SATURDAY'
      timezone: dateTimeSettings.timezone,           // IANA timezone string
      updateDateTimeSettings                         // Call this after Company Profile save
    }),
    [state, setField, setState, resetState, customizationOpen, loadStateFromDb, dateTimeSettings, updateDateTimeSettings]
  );

  return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}

ConfigProvider.propTypes = { children: PropTypes.node };
