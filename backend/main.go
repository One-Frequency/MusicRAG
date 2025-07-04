package main

import (
	"log"
	"net/http"
	"os"

	"github.com/One-Frequency/MusicRAG/backend/internal/api"
	"github.com/One-Frequency/MusicRAG/backend/internal/azure"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	azure.Init()
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Or your deployed frontend URL(s)
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check route
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API routes
	apiRoutes := r.Group("/api")
	{
		apiRoutes.GET("/hello", api.HelloHandler)
		apiRoutes.POST("/chat", api.ChatHandler)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server started on http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
