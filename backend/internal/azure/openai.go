package azure

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// API-specific request and response structures
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []ChatMessage `json:"messages"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func GetCompletion(ctx context.Context, query string, documents []string) (string, error) {
	deployment := getOpenAIDeploymentName()
	url := fmt.Sprintf("%s/openai/deployments/%s/chat/completions?api-version=2023-05-15", openaiEndpoint, deployment)

	// Build the chat messages
	messages := []ChatMessage{
		{Role: "system", Content: "You are a helpful assistant."},
		{Role: "user", Content: query},
	}
	for _, doc := range documents {
		messages = append(messages, ChatMessage{Role: "assistant", Content: doc})
	}

	// Create the request body
	reqBody, err := json.Marshal(ChatRequest{Messages: messages})
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create the HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", openaiAPIKey)

	// Send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read and parse the response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("received non-200 status code: %d - %s", resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to unmarshal response body: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return chatResp.Choices[0].Message.Content, nil
}

func getOpenAIDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_GPT")
}

func getEmbeddingDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDING")
}
