package azure

import (
	"log"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/ai/azopenai"
	"github.com/joho/godotenv"
)

var (
	OpenAIClient         *azopenai.Client
	SearchClientInstance *SearchClient
)

func Init() {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	// Initialize OpenAI Client
	openaiEndpoint := os.Getenv("AZURE_OPENAI_ENDPOINT")
	openaiAPIKey := os.Getenv("AZURE_OPENAI_API_KEY")

	if openaiEndpoint == "" || openaiAPIKey == "" {
		log.Fatalf("AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set")
	}

	OpenAIClient, err = NewOpenAIClient(openaiEndpoint, openaiAPIKey)
	if err != nil {
		log.Fatalf("Failed to create OpenAI client: %v", err)
	}

	// Initialize Search Client
	searchEndpoint := os.Getenv("AZURE_SEARCH_ENDPOINT")
	searchAPIKey := os.Getenv("AZURE_SEARCH_API_KEY")
	searchIndexName := os.Getenv("AZURE_SEARCH_INDEX_NAME")
	subscriptionID := os.Getenv("AZURE_SUBSCRIPTION_ID")

	if searchEndpoint == "" || searchAPIKey == "" || searchIndexName == "" {
		log.Fatalf("AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_API_KEY, and AZURE_SEARCH_INDEX_NAME must be set")
	}

	searchClient, err := NewSearchClient(subscriptionID, searchEndpoint, searchAPIKey, searchIndexName)
	if err != nil {
		log.Fatalf("Failed to create Search client: %v", err)
	}
	SearchClientInstance = searchClient

	log.Println("Azure clients initialized successfully")
}
