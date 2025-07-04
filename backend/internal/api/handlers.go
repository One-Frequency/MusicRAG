package api

import (
	"fmt"
	"net/http"

	"github.com/One-Frequency/MusicRAG/backend/internal/azure"
	"github.com/gin-gonic/gin"
)

func HelloHandler(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		name = "World"
	}
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Hello, %s!", name)})
}

func ChatHandler(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get embeddings for the query
	embeddings, err := azure.GetEmbeddings(c, []string{req.Query})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Query the search index
	documents, err := azure.SearchClient.Query(c, embeddings)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get a completion from the language model
	completion, err := azure.GetCompletion(c, req.Query, documents)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := RagResponse{
		Content: completion,
		Sources: documents,
	}

	c.JSON(http.StatusOK, response)
}
