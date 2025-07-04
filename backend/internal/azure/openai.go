package azure

import (
	"context"
	"fmt"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
)

func GetCompletion(ctx context.Context, query string, documents []string) (string, error) {
	deployment := getOpenAIDeploymentName()

	// Build the chat messages
	messages := []azopenai.ChatRequestMessage{
		{Role: azopenai.ChatRoleSystem, Content: to.Ptr("You are a helpful assistant.")},
		{Role: azopenai.ChatRoleUser, Content: to.Ptr(query)},
	}
	for _, doc := range documents {
		messages = append(messages, azopenai.ChatRequestMessage{Role: azopenai.ChatRoleAssistant, Content: to.Ptr(doc)})
	}

	// Get the chat completions
	resp, err := OpenAIClient.GetChatCompletions(ctx, azopenai.GetChatCompletionsOptions{
		Messages:       messages,
		DeploymentName: &deployment,
	})
	if err != nil {
		return "", fmt.Errorf("failed to get chat completions: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return *resp.Choices[0].Message.Content, nil
}

func NewOpenAIClient(endpoint, apiKey string) (*azopenai.Client, error) {
	cred := azopenai.NewKeyCredential(apiKey)
	client, err := azopenai.NewClientWithCredential(endpoint, cred, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create new openai client: %w", err)
	}
	return client, nil
}

func getOpenAIDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_GPT")
}

func getEmbeddingDeploymentName() string {
	return os.Getenv("AZURE_OPENAI_DEPLOYMENT_EMBEDDING")
}
