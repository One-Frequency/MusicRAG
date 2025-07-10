import {
  AuthState,
  EnterpriseUser,
  LoginCredentials,
  RegisterData,
} from '@/types/auth';
import { create } from 'zustand';

// Amplify configuration will be initialized in main.tsx
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<EnterpriseUser>) => Promise<void>;
  hasPermission: (
    permission: keyof EnterpriseUser['servicePermissions']
  ) => boolean;
  hasRole: (role: string) => boolean;
  hasTier: (tier: EnterpriseUser['userTier']) => boolean;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

// Helper function to extract user data from Cognito user
const mapCognitoUserToEnterpriseUser = (
  cognitoUser: any,
  attributes: any
): EnterpriseUser => {
  const groups = attributes['cognito:groups'] || [];
  const userTier = attributes['custom:userTier'] || 'standard';

  // Map groups to service permissions
  const servicePermissions = {
    chat: true, // All users get chat access
    analytics:
      groups.includes('Premium') ||
      groups.includes('Administrators') ||
      userTier === 'premium' ||
      userTier === 'admin',
    admin: groups.includes('Administrators') || userTier === 'admin',
  };

  return {
    userId: cognitoUser.userId || cognitoUser.sub,
    email: attributes.email,
    userTier: userTier as EnterpriseUser['userTier'],
    servicePermissions,
    groups,
    department: attributes['custom:department'],
    role: attributes['custom:role'],
    lastLogin: new Date().toISOString(),
    loginCount: parseInt(attributes['custom:loginCount'] || '0', 10),
    mfaEnabled: cognitoUser.mfaEnabled || false,
    profile: {
      firstName: attributes.given_name || attributes['custom:firstName'] || '',
      lastName: attributes.family_name || attributes['custom:lastName'] || '',
      phoneNumber: attributes.phone_number,
      profilePicture: attributes.picture || attributes['custom:profilePicture'],
    },
  };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (isSignedIn) {
        // Get user details after successful login
        const user = await getCurrentUser();
        const session = await fetchAuthSession();
        const tokens = session.tokens;

        if (tokens?.idToken) {
          const payload = tokens.idToken.payload;
          const enterpriseUser = mapCognitoUserToEnterpriseUser(user, payload);

          set({
            user: enterpriseUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } else {
        // Handle MFA or other next steps
        set({
          isLoading: false,
          error: 'Additional authentication steps required',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });

    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
            phone_number: data.phoneNumber,
            'custom:department': data.department,
            'custom:userTier': 'standard',
          },
        },
      });

      if (isSignUpComplete) {
        set({
          isLoading: false,
          error: null,
        });
      } else {
        // Email confirmation required
        set({
          isLoading: false,
          error: 'Please check your email to confirm your account',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Logout failed',
      });
    }
  },

  refreshToken: async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      if (session.tokens?.idToken) {
        const user = await getCurrentUser();
        const payload = session.tokens.idToken.payload;
        const enterpriseUser = mapCognitoUserToEnterpriseUser(user, payload);

        set({
          user: enterpriseUser,
          isAuthenticated: true,
        });
      }
    } catch (error: any) {
      // Token refresh failed, user needs to re-authenticate
      set({
        user: null,
        isAuthenticated: false,
        error: 'Session expired, please log in again',
      });
    }
  },

  updateProfile: async (updates: Partial<EnterpriseUser>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    set({ isLoading: true, error: null });

    try {
      // Update local state immediately for better UX
      const updatedUser = { ...currentUser, ...updates };
      set({
        user: updatedUser,
        isLoading: false,
      });

      // TODO: Implement actual profile update via API
      // This would involve calling your backend API to update user attributes
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Profile update failed',
      });
      throw error;
    }
  },

  hasPermission: (permission: keyof EnterpriseUser['servicePermissions']) => {
    const user = get().user;
    return user?.servicePermissions[permission] || false;
  },

  hasRole: (role: string) => {
    const user = get().user;
    return user?.groups.includes(role) || false;
  },

  hasTier: (tier: EnterpriseUser['userTier']) => {
    const user = get().user;
    return user?.userTier === tier || false;
  },

  clearError: () => {
    set({ error: null });
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      if (session.tokens?.idToken) {
        const payload = session.tokens.idToken.payload;
        const enterpriseUser = mapCognitoUserToEnterpriseUser(user, payload);

        set({
          user: enterpriseUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      // User is not authenticated
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
