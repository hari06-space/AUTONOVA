import { useContext } from 'react';
import { ConfigContext } from 'contexts/ConfigContext';
import config from 'config';

// ==============================|| CONFIG - HOOKS ||============================== //

const defaultConfig = {
  ...config,
  mode: 'light',
  onChangeMode: () => {},
  dateTimeSettings: {
    timeFormat: (typeof window !== 'undefined' && localStorage.getItem('timeFormat')) || 'H24',
    dateFormat: (typeof window !== 'undefined' && localStorage.getItem('dateFormat')) || 'DD/MM/YYYY',
    weekStartsOn: (typeof window !== 'undefined' && localStorage.getItem('weekStartsOn')) || 'MONDAY',
    timezone: (typeof window !== 'undefined' && localStorage.getItem('appTimezone')) || 'Asia/Kolkata'
  }
};

export default function useConfig() {
  const context = useContext(ConfigContext);

  if (!context) {
    return defaultConfig;
  }

  return context;
}
