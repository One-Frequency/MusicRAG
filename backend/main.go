package main

import (
	"log"
	"net/http"
	"os"

	"github.com/One-Frequency/MusicRAG/backend/internal/api"
	"github.com/One-Frequency/MusicRAG/backend/internal/auth"
	"github.com/One-Frequency/MusicRAG/backend/internal/azure"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file for local development only
	// In production/Docker, environment variables are set by the container runtime
	if os.Getenv("ENVIRONMENT") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found (this is normal in production)")
		}
	}

	azure.Init()
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "https://app.onefrequency.ai"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check route (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "enterprise_mode": os.Getenv("ENTERPRISE_MODE")})
	})

	// Public API routes
	publicAPI := r.Group("/api")
	{
		publicAPI.GET("/hello", api.HelloHandler)
	}

	// Protected API routes (require authentication)
	protectedAPI := r.Group("/api")
	protectedAPI.Use(auth.AuthMiddleware())
	{
		protectedAPI.POST("/chat", auth.RequirePermission("chat"), api.ChatHandler)
	}

	// Development route for testing auth (optional auth)
	devAPI := r.Group("/api/dev")
	devAPI.Use(auth.OptionalAuthMiddleware())
	{
		devAPI.GET("/user", func(c *gin.Context) {
			user := auth.GetUserFromContext(c)
			if user == nil {
				c.JSON(http.StatusOK, gin.H{"authenticated": false})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"authenticated": true,
				"user":          user,
			})
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server started on http://localhost:%s", port)
	log.Printf("Enterprise mode: %s", os.Getenv("ENTERPRISE_MODE"))
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
