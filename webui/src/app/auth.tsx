import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

interface AuthProps {
  children: React.ReactNode;
}

export function Auth({ children }: AuthProps) {
  return (
    <Authenticator hideSignUp loginMechanism={'email'}>
      {children}
    </Authenticator>
  );
}
