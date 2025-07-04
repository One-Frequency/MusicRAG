package azure

import (
	"context"
	"net/http"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/policy"
	"github.com/wbreza/azure-sdk-for-go/sdk/data/azsearchindex"
)

// keyTransport is a custom policy.Transporter that injects the api-key header.
type keyTransport struct {
	apiKey string
	client *http.Client
}

// Do adds the api-key header and sends the request using the underlying http.Client.
func (t *keyTransport) Do(req *http.Request) (*http.Response, error) {
	req.Header.Set("api-key", t.apiKey)
	return t.client.Do(req)
}

// dummyCredential is a placeholder to satisfy the NewDocumentsClient constructor, which requires a TokenCredential.
// The actual authentication is handled by the keyTransport.
type dummyCredential struct{}

// GetToken returns a dummy token and never fails.
func (c *dummyCredential) GetToken(ctx context.Context, options policy.TokenRequestOptions) (azcore.AccessToken, error) {
	return azcore.AccessToken{Token: "dummy"}, nil
}

type SearchClient struct {
	client *azsearchindex.DocumentsClient
}

func (c *SearchClient) Query(ctx context.Context, query string) ([]string, error) {
	results, err := c.client.SearchGet(ctx, &azsearchindex.DocumentsClientSearchGetOptions{
		SearchText: &query,
	}, nil, nil)
	if err != nil {
		return nil, err
	}

	var documents []string
	// The result documents are in the `Results` field, and each document's fields are in `AdditionalProperties`.
	for _, result := range results.Results {
		if content, ok := result.AdditionalProperties["content"].(string); ok {
			documents = append(documents, content)
		}
	}

	return documents, nil
}

// NewSearchClient creates a new SearchClient.
// This function contains a workaround for the wbreza/azsearchindex fork, which does not
// provide a public constructor for API key authentication.
func NewSearchClient(subscriptionID, endpoint, apiKey, indexName string) (*SearchClient, error) {
	// Create client options with our custom transport to inject the API key.
	options := &azcore.ClientOptions{
		Transport: &keyTransport{apiKey: apiKey, client: &http.Client{}},
	}

	// The constructor requires a TokenCredential, so we provide a dummy one.
	// The real authentication is handled by the keyTransport.
	cred := &dummyCredential{}

	client, err := azsearchindex.NewDocumentsClient(endpoint, indexName, cred, options)
	if err != nil {
		return nil, err
	}

	return &SearchClient{client: client}, nil
}
