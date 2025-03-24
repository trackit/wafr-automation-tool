import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import { SnackbarProvider } from 'notistack';

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
        <Authenticator hideSignUp loginMechanism={'email'}>
          <App />
        </Authenticator>
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>
);
