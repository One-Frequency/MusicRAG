package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// UserClaims represents the claims extracted from a JWT token
type UserClaims struct {
	Sub           string   `json:"sub"`
	Email         string   `json:"email"`
	Groups        []string `json:"cognito:groups"`
	UserTier      string   `json:"custom:userTier"`
	Department    string   `json:"custom:department,omitempty"`
	Role          string   `json:"custom:role,omitempty"`
	FirstName     string   `json:"given_name,omitempty"`
	LastName      string   `json:"family_name,omitempty"`
	PhoneNumber   string   `json:"phone_number,omitempty"`
	Exp           int64    `json:"exp"`
	Iat           int64    `json:"iat"`
	Aud           string   `json:"aud"`
	Iss           string   `json:"iss"`
}

// Implement jwt.Claims interface
func (c UserClaims) GetExpirationTime() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.Exp, 0)), nil
}

func (c UserClaims) GetIssuedAt() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(time.Unix(c.Iat, 0)), nil
}

func (c UserClaims) GetNotBefore() (*jwt.NumericDate, error) {
	return nil, nil
}

func (c UserClaims) GetIssuer() (string, error) {
	return c.Iss, nil
}

func (c UserClaims) GetSubject() (string, error) {
	return c.Sub, nil
}

func (c UserClaims) GetAudience() (jwt.ClaimStrings, error) {
	return []string{c.Aud}, nil
}

// EnterpriseUser represents the user data structure for enterprise features
type EnterpriseUser struct {
	UserID             string                 `json:"userId" db:"user_id"`
	Email              string                 `json:"email" db:"email"`
	UserTier           string                 `json:"userTier" db:"user_tier"`
	ServicePermissions map[string]bool        `json:"servicePermissions" db:"service_permissions"`
	Groups             []string               `json:"groups" db:"groups"`
	Department         *string                `json:"department,omitempty" db:"department"`
	Role               *string                `json:"role,omitempty" db:"role"`
	CreatedAt          time.Time              `json:"createdAt" db:"created_at"`
	LastLogin          *time.Time             `json:"lastLogin,omitempty" db:"last_login"`
	LoginCount         int                    `json:"loginCount" db:"login_count"`
	MFAEnabled         bool                   `json:"mfaEnabled" db:"mfa_enabled"`
	Profile            UserProfile            `json:"profile"`
}

// UserProfile represents the user's profile information
type UserProfile struct {
	FirstName      string  `json:"firstName"`
	LastName       string  `json:"lastName"`
	PhoneNumber    *string `json:"phoneNumber,omitempty"`
	ProfilePicture *string `json:"profilePicture,omitempty"`
}

// HasPermission checks if the user has a specific permission
func (u *EnterpriseUser) HasPermission(permission string) bool {
	if u.ServicePermissions == nil {
		return false
	}
	return u.ServicePermissions[permission]
}

// HasRole checks if the user has a specific role
func (u *EnterpriseUser) HasRole(role string) bool {
	for _, userRole := range u.Groups {
		if userRole == role {
			return true
		}
	}
	return false
}

// IsPremium checks if the user has premium tier access
func (u *EnterpriseUser) IsPremium() bool {
	return u.UserTier == "premium" || u.UserTier == "admin"
}

// IsAdmin checks if the user has admin tier access
func (u *EnterpriseUser) IsAdmin() bool {
	return u.UserTier == "admin" || u.HasRole("Administrators")
}

// TokenResponse represents the structure of token-related responses
type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	IdToken      string `json:"idToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	RememberMe bool   `json:"rememberMe"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=8"`
	FirstName   string  `json:"firstName" binding:"required"`
	LastName    string  `json:"lastName" binding:"required"`
	PhoneNumber *string `json:"phoneNumber,omitempty"`
	Department  *string `json:"department,omitempty"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User         *EnterpriseUser `json:"user"`
	AccessToken  string          `json:"accessToken"`
	RefreshToken string          `json:"refreshToken"`
	ExpiresIn    int64           `json:"expiresIn"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}
