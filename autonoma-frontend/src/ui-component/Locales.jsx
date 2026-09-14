import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';

// third party
import { IntlProvider } from 'react-intl';
import useConfig from 'hooks/useConfig';

// load locales files
function loadLocaleData(i18n) {
  switch (i18n) {
    case 'fr':
      return import('utils/locales/fr.json');
    case 'ro':
      return import('utils/locales/ro.json');
    case 'zh':
      return import('utils/locales/zh.json');
    case 'ta':
      return import('utils/locales/ta.json');
    case 'hi':
      return import('utils/locales/hi.json');
    default:
      return import('utils/locales/en.json');
  }
}

export default function Locales({ children }) {
  const {
    state: { i18n }
  } = useConfig();
  const [messages, setMessages] = useState({});

  const localeDataPromise = useMemo(() => loadLocaleData(i18n), [i18n]);
  useEffect(() => {
    localeDataPromise.then((d) => {
      setMessages(d.default);
    });
  }, [localeDataPromise]);

  // Always render children; use empty messages as fallback until locale data loads
  return (
    <IntlProvider
      locale={i18n}
      defaultLocale="en"
      messages={messages}
      onError={(err) => {
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        console.error(err);
      }}
    >
      {children}
    </IntlProvider>
  );
}

Locales.propTypes = { children: PropTypes.node };
