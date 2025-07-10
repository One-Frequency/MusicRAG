import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID as string,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN?.replace(
            'https://',
            ''
          ) as string,
          scopes: [
            'email',
            'profile',
            'openid',
            'aws.cognito.signin.user.admin',
          ],
          redirectSignIn: [import.meta.env.VITE_AUTH_REDIRECT_URI as string],
          redirectSignOut: [import.meta.env.VITE_AUTH_LOGOUT_URI as string],
          responseType: 'code' as const,
        },
        email: true,
      },
    },
  },
};

// Configure Amplify
export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig;
