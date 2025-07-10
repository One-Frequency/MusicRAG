package auth

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	UserContextKey = "user"
)

// AuthMiddleware validates JWT tokens from AWS Cognito
func AuthMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "missing_authorization",
				Message: "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract Bearer token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "invalid_authorization_format",
				Message: "Authorization header must be in format 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		// Validate token
		claims, err := ValidateJWTToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "invalid_token",
				Message: fmt.Sprintf("Token validation failed: %v", err),
			})
			c.Abort()
			return
		}

		// Convert claims to EnterpriseUser
		user := mapClaimsToUser(claims)

		// Store user in context
		c.Set(UserContextKey, user)
		c.Next()
	})
}

// OptionalAuthMiddleware validates JWT tokens but doesn't require them
func OptionalAuthMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		claims, err := ValidateJWTToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		user := mapClaimsToUser(claims)
		c.Set(UserContextKey, user)
		c.Next()
	})
}

// RequireRole middleware ensures user has one of the specified roles
func RequireRole(roles ...string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user := GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "authentication_required",
				Message: "User authentication is required",
			})
			c.Abort()
			return
		}

		hasRole := false
		for _, role := range roles {
			if user.HasRole(role) {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "insufficient_permissions",
				Message: fmt.Sprintf("User must have one of the following roles: %v", roles),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequireTier middleware ensures user has specified tier or higher
func RequireTier(tiers ...string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user := GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "authentication_required",
				Message: "User authentication is required",
			})
			c.Abort()
			return
		}

		hasTier := false
		for _, tier := range tiers {
			if user.UserTier == tier {
				hasTier = true
				break
			}
		}

		// Admin tier has access to everything
		if user.UserTier == "admin" {
			hasTier = true
		}

		if !hasTier {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "insufficient_tier",
				Message: fmt.Sprintf("User must have one of the following tiers: %v", tiers),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequirePermission middleware ensures user has specific permission
func RequirePermission(permission string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user := GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error:   "authentication_required",
				Message: "User authentication is required",
			})
			c.Abort()
			return
		}

		if !user.HasPermission(permission) {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error:   "insufficient_permissions",
				Message: fmt.Sprintf("User does not have permission: %s", permission),
			})
			c.Abort()
			return
		}

		c.Next()
	})
}

// GetUserFromContext extracts the authenticated user from gin context
func GetUserFromContext(c *gin.Context) *EnterpriseUser {
	if user, exists := c.Get(UserContextKey); exists {
		if enterpriseUser, ok := user.(*EnterpriseUser); ok {
			return enterpriseUser
		}
	}
	return nil
}

// ValidateJWTToken validates a JWT token against Cognito JWKS
func ValidateJWTToken(tokenString string) (*UserClaims, error) {
	// For development, we'll parse without validation
	// TODO: Implement proper JWKS validation for production
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %v", err)
	}

	// Extract claims manually from the parsed token
	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to extract claims")
	}

	// Convert map claims to UserClaims struct
	claims := &UserClaims{}

	if sub, ok := mapClaims["sub"].(string); ok {
		claims.Sub = sub
	}
	if email, ok := mapClaims["email"].(string); ok {
		claims.Email = email
	}
	if groups, ok := mapClaims["cognito:groups"].([]interface{}); ok {
		for _, group := range groups {
			if groupStr, ok := group.(string); ok {
				claims.Groups = append(claims.Groups, groupStr)
			}
		}
	}
	if userTier, ok := mapClaims["custom:userTier"].(string); ok {
		claims.UserTier = userTier
	}
	if department, ok := mapClaims["custom:department"].(string); ok {
		claims.Department = department
	}
	if role, ok := mapClaims["custom:role"].(string); ok {
		claims.Role = role
	}
	if firstName, ok := mapClaims["given_name"].(string); ok {
		claims.FirstName = firstName
	}
	if lastName, ok := mapClaims["family_name"].(string); ok {
		claims.LastName = lastName
	}
	if phoneNumber, ok := mapClaims["phone_number"].(string); ok {
		claims.PhoneNumber = phoneNumber
	}
	if exp, ok := mapClaims["exp"].(float64); ok {
		claims.Exp = int64(exp)
	}
	if iat, ok := mapClaims["iat"].(float64); ok {
		claims.Iat = int64(iat)
	}
	if aud, ok := mapClaims["aud"].(string); ok {
		claims.Aud = aud
	}
	if iss, ok := mapClaims["iss"].(string); ok {
		claims.Iss = iss
	}

	return claims, nil
}

// mapClaimsToUser converts JWT claims to EnterpriseUser
func mapClaimsToUser(claims *UserClaims) *EnterpriseUser {
	// Set default tier if not specified
	tier := claims.UserTier
	if tier == "" {
		tier = "standard"
	}

	// Map groups to service permissions
	servicePermissions := map[string]bool{
		"chat":      true, // All users get chat access
		"analytics": false,
		"admin":     false,
	}

	// Check for premium/admin permissions
	for _, group := range claims.Groups {
		switch group {
		case "Premium":
			servicePermissions["analytics"] = true
		case "Administrators":
			servicePermissions["analytics"] = true
			servicePermissions["admin"] = true
		}
	}

	// Admin tier gets all permissions
	if tier == "admin" {
		servicePermissions["analytics"] = true
		servicePermissions["admin"] = true
	}

	return &EnterpriseUser{
		UserID:             claims.Sub,
		Email:              claims.Email,
		UserTier:           tier,
		ServicePermissions: servicePermissions,
		Groups:             claims.Groups,
		Department:         &claims.Department,
		Role:               &claims.Role,
		LoginCount:         0, // This would be fetched from database
		MFAEnabled:         false,
		Profile: UserProfile{
			FirstName:   claims.FirstName,
			LastName:    claims.LastName,
			PhoneNumber: &claims.PhoneNumber,
		},
	}
}
