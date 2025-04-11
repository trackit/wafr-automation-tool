import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Amplify } from 'aws-amplify';
import { SnackbarProvider } from 'notistack';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './app/app';

import { amplifyConfig } from './amplify.config';

Amplify.configure(amplifyConfig);
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <BrowserRouter>
          {/* <Auth> */}
            <App />
          {/* </Auth> */}
        </BrowserRouter>
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>
);
