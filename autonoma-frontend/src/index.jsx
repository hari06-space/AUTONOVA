import { createRoot } from 'react-dom/client';

// Suppress legacy MUI Grid props runtime warnings from polluting the console
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('MUI Grid:')) {
    return;
  }
  originalWarn(...args);
};


// third party
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// project imports
import App from 'App';
import { store, persister } from 'store';
import * as serviceWorker from 'serviceWorker';
import reportWebVitals from 'reportWebVitals';
import { ConfigProvider } from 'contexts/ConfigContext';
import { showAppAlert } from 'utils/alert';
import { FaceDetectionService } from 'utils/face';

// Eagerly preload neural network models in WebGL background at application startup
setTimeout(() => {
  FaceDetectionService.initialize().catch(() => {});
}, 100);

// style + assets
import 'assets/scss/style.scss';

// yet-another-react-lightbox
import 'yet-another-react-lightbox/styles.css';

// maplibre CSS is lazy-loaded only when the map page is visited
// (imported inside the map module to avoid 600KB on every page load)

// Primary font: Roboto is loaded eagerly as the default fallback.
// All other font families (Poppins, Public Sans, Plus Jakarta Sans, Montserrat)
// are dynamically lazy-loaded inside ConfigContext when selected by the user,
// eliminating unnecessary eager woff2 downloads on boot.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// ==============================|| GLOBAL ERROR CATCHERS ||============================== //

let lastAlertedMsg = '';
let lastAlertedTime = 0;

window.showAlert = function (msg) {
  const now = Date.now();
  if (msg === lastAlertedMsg && now - lastAlertedTime < 1000) {
    return;
  }
  lastAlertedMsg = msg;
  lastAlertedTime = now;
  try {
    showAppAlert(msg, 'error');
  } catch (e) {
    console.error('Failed to show app alert:', e);
    alert(msg);
  }
};

window.onerror = function (message, source, lineno, colno, error) {
  const msgStr = String(message || '');
  if (msgStr.includes('ResizeObserver') || msgStr.includes('Resize observer')) {
    return true; // Suppress harmless ResizeObserver notifications
  }
  const errMsg = error?.stack || `${message} at ${source}:${lineno}:${colno}`;
  console.error('[Global UI Error]', errMsg);
  window.showAlert(`UI Rendering / JavaScript Error:\n\n${message}\n\nLocation: ${source}:${lineno}\n\nPlease check console for details.`);
  return false; // let browser print it to console too
};

window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason;
  // If it's a promise rejection representing an API error, axios interceptor already handles it
  if (reason && (reason.config || reason.isAxiosError)) {
    return;
  }
  const errMsg =
    reason?.stack || reason?.message || (typeof reason === 'string' ? reason : JSON.stringify(reason)) || 'Unhandled promise rejection';
  console.error('[Global Unhandled Rejection]', errMsg);
  window.showAlert(`Unhandled Promise Rejection:\n\n${errMsg}`);
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persister}>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </PersistGate>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
