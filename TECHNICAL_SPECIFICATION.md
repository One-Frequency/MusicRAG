# Enterprise Authentication System - Technical Specification

## Executive Summary

This document outlines the technical implementation plan for transforming the MusicRAG application into an enterprise-grade platform with comprehensive authentication, user management, and role-based access control.

## Current State Analysis

### Frontend Architecture
- **Framework**: React 19.1.0 + TypeScript + Vite
- **State Management**: Zustand 5.0.5
- **Styling**: TailwindCSS 4.1.10
- **HTTP Client**: Axios 1.10.0
- **Current Structure**: Simple chat interface with file upload

### Backend Architecture
- **Framework**: Go 1.24.4 + Gin 1.10.1
- **Cloud Integration**: Azure OpenAI + Azure Search
- **Current Endpoints**: `/health`, `/api/hello`, `/api/chat`
- **No Authentication**: Currently open access

### Infrastructure Dependencies
- **Deployment**: AWS Amplify (external architecture project)
- **Available Services**: Cognito, DynamoDB, Lambda, API Gateway, S3, etc.

## Implementation Strategy

### Phase 1: Foundation (Core Authentication)
**Priority**: CRITICAL | **Timeline**: Week 1

#### 1.1 Environment Configuration
```bash
# Frontend Environment Variables
VITE_AWS_REGION=us-east-2
VITE_USER_POOL_ID=us-east-2_JKsb0fPHX
VITE_USER_POOL_CLIENT_ID=4qbitb6voa560333ajlg090dh6
VITE_COGNITO_DOMAIN=https://onefrequency-enterprise-dev.auth.us-east-2.amazoncognito.com
VITE_AUTH_REDIRECT_URI=https://app.onefrequency.ai/auth/callback
VITE_AUTH_LOGOUT_URI=https://app.onefrequency.ai/auth/logout
VITE_ENTERPRISE_MODE=true

# Backend Environment Variables
USER_POOL_ID=us-east-2_JKsb0fPHX
USER_POOL_CLIENT_ID=4qbitb6voa560333ajlg090dh6
COGNITO_REGION=us-east-2
JWKS_URL=https://cognito-idp.us-east-2.amazonaws.com/us-east-2_JKsb0fPHX/.well-known/jwks.json
```

#### 1.2 Frontend Dependencies
```json
{
  "dependencies": {
    "@aws-amplify/ui-react": "^6.1.6",
    "aws-amplify": "^6.0.14",
    "react-router-dom": "^6.21.1",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4"
  }
}
```

#### 1.3 Backend Dependencies
```go
// go.mod additions
github.com/golang-jwt/jwt/v5 v5.2.0
github.com/lestrrat-go/jwx/v2 v2.0.18
```

### Phase 2: Authentication Components (Week 1-2)

#### 2.1 Type Definitions
```typescript
// src/types/auth.ts
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
```

#### 2.2 Authentication Store (Zustand)
```typescript
// src/stores/authStore.ts
interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profile: Partial<EnterpriseUser>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<EnterpriseUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}
```

#### 2.3 Key Components to Implement
```
src/components/auth/
├── AuthGuard.tsx                 # Route protection wrapper
├── LoginForm.tsx                 # Email/password login
├── RegisterForm.tsx              # User registration
├── ForgotPasswordForm.tsx        # Password reset
├── ProtectedRoute.tsx            # Role-based route protection
└── AuthCallback.tsx              # OAuth callback handler

src/pages/auth/
├── LoginPage.tsx                 # Login page layout
├── RegisterPage.tsx              # Registration page
├── ForgotPasswordPage.tsx        # Password reset page
└── CallbackPage.tsx              # Auth callback page
```

### Phase 3: User Dashboard (Week 2-3)

#### 3.1 Dashboard Architecture
```
src/pages/dashboard/
├── DashboardPage.tsx             # Main dashboard container
├── ProfilePage.tsx               # User profile management
├── SettingsPage.tsx              # Account settings
├── SecurityPage.tsx              # Security settings
└── BillingPage.tsx               # Billing management

src/components/dashboard/
├── DashboardLayout.tsx           # Dashboard wrapper with navigation
├── ProfileCard.tsx               # Profile information display
├── ServiceCard.tsx               # Service access cards
├── UsageChart.tsx                # Usage analytics display
├── SecurityLog.tsx               # Security activity log
└── NotificationCenter.tsx        # In-app notifications
```

#### 3.2 Smart Landing Logic
```typescript
// src/components/SmartLanding.tsx
interface LandingProps {
  children: React.ReactNode;
}

// Logic Flow:
// 1. Check authentication status
// 2. Detect returning vs new user
// 3. Route to appropriate interface:
//    - Authenticated → Dashboard
//    - Returning → Login
//    - New → Registration
//    - Expired session → Re-authentication
```

### Phase 4: Backend Authentication (Week 1-2)

#### 4.1 Authentication Module Structure
```
backend/internal/auth/
├── cognito.go                    # Cognito integration
├── middleware.go                 # JWT validation middleware
├── handlers.go                   # Auth endpoint handlers
├── types.go                      # Auth-related types
└── service.go                    # Auth business logic

backend/internal/users/
├── models.go                     # User data models
├── repository.go                 # User data access
├── service.go                    # User business logic
└── handlers.go                   # User management endpoints
```

#### 4.2 API Endpoints
```go
// Authentication Endpoints
POST /api/auth/login              // User login
POST /api/auth/register           // User registration
POST /api/auth/logout             // User logout
POST /api/auth/refresh            // Token refresh
POST /api/auth/forgot-password    // Password reset request
POST /api/auth/reset-password     // Password reset confirmation

// User Management Endpoints
GET  /api/user/profile            // Get user profile
PUT  /api/user/profile            // Update user profile
GET  /api/user/settings           // Get user settings
PUT  /api/user/settings           // Update user settings
GET  /api/user/security           // Get security info
POST /api/user/change-password    // Change password

// Service Access Endpoints
GET  /api/services/available      // Get available services
GET  /api/services/access         // Get user service access
POST /api/services/configure      // Configure service settings
```

#### 4.3 Database Schema
```sql
-- Enhanced Users Table (extending current if exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_tier VARCHAR(20) DEFAULT 'standard',
    service_permissions JSONB DEFAULT '{"chat": true, "analytics": false, "admin": false}',
    cognito_groups JSONB DEFAULT '[]',
    department VARCHAR(100),
    role VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_picture VARCHAR(500),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    mfa_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Sessions Table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- User Settings Table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    theme_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 5: Service Integration (Week 3-4)

#### 5.1 Enhanced Chat Service
```go
// Integrate existing chat with authentication
func (h *ChatHandler) HandleChat(c *gin.Context) {
    user := GetUserFromContext(c)

    // Check permissions
    if !user.HasPermission("chat") {
        c.JSON(403, gin.H{"error": "Chat access denied"})
        return
    }

    // Apply tier-based limitations
    if user.UserTier == "standard" {
        // Apply rate limiting, feature restrictions
    }

    // Existing chat logic with user context
}
```

#### 5.2 Service Access Control
```typescript
// Frontend service access logic
const ServiceAccessManager = () => {
  const { user, hasPermission } = useAuth();

  const availableServices = [
    {
      id: 'chat',
      name: 'AI Chat Assistant',
      description: 'Music creation assistance',
      permission: 'chat',
      tier: 'standard'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Detailed usage insights',
      permission: 'analytics',
      tier: 'premium'
    },
    {
      id: 'admin',
      name: 'Admin Dashboard',
      description: 'User management',
      permission: 'admin',
      tier: 'admin'
    }
  ];

  return availableServices.filter(service =>
    hasPermission(service.permission)
  );
};
```

## Security Implementation

### Frontend Security
- **Token Storage**: Secure httpOnly cookies via AWS Amplify
- **CSRF Protection**: Built-in with AWS Cognito
- **Input Validation**: Zod schemas for all forms
- **Route Protection**: Authentication guards on all protected routes
- **Session Management**: Automatic token refresh with fallback

### Backend Security
- **JWT Validation**: Cognito JWKS validation on every request
- **CORS Configuration**: Strict origin validation
- **Rate Limiting**: Per-user and per-endpoint limits
- **Request Logging**: Comprehensive audit trail
- **Permission Validation**: Role-based access on every endpoint

## Testing Strategy

### Frontend Testing
```
src/__tests__/
├── components/auth/              # Authentication component tests
├── stores/                       # State management tests
├── pages/                        # Page integration tests
└── utils/                        # Utility function tests
```

### Backend Testing
```
backend/internal/
├── auth/auth_test.go             # Authentication logic tests
├── users/users_test.go           # User management tests
├── middleware/middleware_test.go # Middleware tests
└── integration/                  # Integration tests
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Tree shaking and dynamic imports
- **Caching Strategy**: React Query for API data caching
- **Error Boundaries**: Graceful error handling

### Backend Optimization
- **Connection Pooling**: Database connection management
- **Caching**: Redis integration for session data
- **Query Optimization**: Indexed database queries
- **Monitoring**: AWS CloudWatch integration

## Deployment Strategy

### Environment Configuration
```bash
# Development
ENVIRONMENT=development
LOG_LEVEL=debug

# Staging
ENVIRONMENT=staging
LOG_LEVEL=info

# Production
ENVIRONMENT=production
LOG_LEVEL=warn
```

### CI/CD Pipeline
1. **Code Quality**: ESLint, Prettier, Go vet
2. **Testing**: Jest (frontend), Go test (backend)
3. **Security Scanning**: OWASP dependency check
4. **Build**: Optimized production builds
5. **Deploy**: AWS Amplify automatic deployment

## Success Metrics

### Technical Metrics
- **Authentication Flow**: < 2 second login time
- **Page Load**: < 1 second initial load
- **API Response**: < 200ms average response time
- **Error Rate**: < 0.1% authentication failures
- **Uptime**: 99.9% availability

### User Experience Metrics
- **Registration Completion**: > 85% completion rate
- **User Engagement**: Active session duration
- **Feature Adoption**: Service utilization rates
- **Support Tickets**: < 5% authentication-related issues

## Next Steps

This specification provides the foundation for implementing the enterprise authentication system. The implementation will proceed in phases, starting with core authentication components and progressively adding advanced features.

**Immediate Next Action**: Begin Phase 1 implementation with environment configuration and basic authentication setup.
