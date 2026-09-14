import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

// routing
import router from 'routes';

// project imports
import Locales from 'ui-component/Locales';
import NavigationScroll from 'layout/NavigationScroll';
import RTLLayout from 'ui-component/RTLLayout';
import Snackbar from 'ui-component/extended/Snackbar';
import Notistack from 'ui-component/third-party/Notistack';
import Metrics from 'metrics';
import BOSConfirmProvider from 'ui-component/bos/BOSConfirmProvider';
import { BossBreakProvider } from 'contexts/BossBreakContext';

import ThemeCustomization from 'themes';

// auth provider
import { JWTProvider as AuthProvider } from 'contexts/JWTContext';
// import { FirebaseProvider as AuthProvider } from 'contexts/FirebaseContext';
// import { Auth0Provider as AuthProvider } from 'contexts/Auth0Context';
// import { AWSCognitoProvider as AuthProvider } from 'contexts/AWSCognitoContext';
// import { SupabseProvider as AuthProvider } from 'contexts/SupabaseContext';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// ==============================|| APP ||============================== //

export default function App() {

  return (
    <>
      <ThemeCustomization>
        <RTLLayout>
          <Locales>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <NavigationScroll>
                <AuthProvider>
                  <BossBreakProvider>
                    <Notistack>
                      <RouterProvider router={router} />
                      <Snackbar />
                    </Notistack>
                    <BOSConfirmProvider />
                  </BossBreakProvider>
                </AuthProvider>
              </NavigationScroll>
            </LocalizationProvider>
          </Locales>
        </RTLLayout>
      </ThemeCustomization>
      <Metrics />
    </>
  );
}
