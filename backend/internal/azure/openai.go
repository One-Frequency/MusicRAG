package azure

import (
	"context"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai"
)

func GetCompletion(ctx context.Context, query string, documents []string) (string, error) {
	// This is a placeholder implementation.
	// In a real application, you would use the query and documents to generate a completion.
	return "This is a dummy response from the language model.", nil
}

func GetEmbeddings(ctx context.Context, texts []string) ([][]float32, error) {
	// This is a placeholder implementation.
	// In a real application, you would use the texts to generate embeddings.
	return [][]float32{{0.1, 0.2, 0.3}}, nil
}

func newOpenAIClient(endpoint, apiKey string) (*azopenai.Client, error) {
	return azopenai.NewClient(endpoint, &azopenai.KeyCredential{Key: apiKey}, nil)
}

func getOpenAIDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_GPT")
}

func getEmbeddingDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDING")
}
