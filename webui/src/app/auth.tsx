import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './auth.css';

interface AuthProps {
  children: React.ReactNode;
}

export function Auth({ children }: AuthProps) {
  return (
    <div className="flex flex-col h-screen justify-center items-center bg-base-200">
      <Authenticator hideSignUp loginMechanism={'email'}>
        {children}
      </Authenticator>
    </div>
  );
}
