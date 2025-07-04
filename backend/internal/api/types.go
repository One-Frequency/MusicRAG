package api

type Message struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Query               string    `json:"query"`
	ConversationHistory []Message `json:"conversationHistory"`
}

type RagResponse struct {
	Content string   `json:"content"`
	Sources []string `json:"sources"`
}
