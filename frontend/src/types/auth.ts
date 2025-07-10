export interface EnterpriseUser {
  userId: string;
  email: string;
  userTier: 'standard' | 'premium' | 'admin';
  servicePermissions: {
    chat: boolean;
    analytics: boolean;
    admin: boolean;
  };
  groups: string[];
  department?: string;
  role?: string;
  lastLogin: string;
  loginCount: number;
  mfaEnabled: boolean;
  profile: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    profilePicture?: string;
  };
}

export interface AuthState {
  user: EnterpriseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  department?: string;
}

export interface AuthContextType extends AuthState {
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
}

export type UserRole = string;
export type UserTier = 'standard' | 'premium' | 'admin';

// Token interfaces
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface UserClaims {
  sub: string;
  email: string;
  'cognito:groups': string[];
  'custom:userTier': string;
  'custom:department'?: string;
  'custom:role'?: string;
  exp: number;
  iat: number;
}
