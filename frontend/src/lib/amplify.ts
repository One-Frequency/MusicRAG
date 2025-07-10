import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
      loginWith: {
        email: true,
        username: true,
      },
    },
  },
};

// Configure Amplify
export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig;
