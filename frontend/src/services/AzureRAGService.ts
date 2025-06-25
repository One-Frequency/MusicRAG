// services/azureRagService.ts
import { Message } from '@/types';

export interface RagResponse {
  content: string;
  sources: string[];
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    page?: number;
    section?: string;
  };
  score: number;
}

export interface RawDocumentChunk {
  id: string;
  content: string;
  metadata_filename: string;
  metadata_section: string;
}

class AzureRagService {
  private endpoint: string;
  private apiKey: string;
  private searchEndpoint: string;
  private searchApiKey: string;
  private indexName: string;

  constructor() {
    // These should be in your environment variables
    this.endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '';
    this.apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY || '';
    this.searchEndpoint = import.meta.env.VITE_AZURE_SEARCH_ENDPOINT || '';
    this.searchApiKey = import.meta.env.VITE_AZURE_SEARCH_API_KEY || '';
    this.indexName =
      import.meta.env.VITE_AZURE_SEARCH_INDEX_NAME || 'music-production-index';
  }

  /**
   * Main RAG query method - retrieves relevant documents and generates response
   */
  async queryWithRag(
    query: string,
    conversationHistory: Message[] = []
  ): Promise<RagResponse> {
    try {
      // Step 1: Retrieve relevant documents using semantic search
      const retrievedDocs = await this.retrieveDocuments(query);

      // Step 2: Generate response using retrieved context
      const response = await this.generateResponse(
        query,
        retrievedDocs,
        conversationHistory
      );

      return response;
    } catch (error) {
      console.error('RAG query failed:', error);
      throw new Error('Failed to process your query. Please try again.');
    }
  }

  /**
   * Retrieve relevant documents from Azure AI Search
   */

  private async retrieveDocuments(query: string): Promise<DocumentChunk[]> {
    const searchUrl = `${this.searchEndpoint}/indexes/${this.indexName}/docs/search?api-version=2023-11-01`;

    const searchBody = {
      search: query,
      select: 'id,content,metadata_filename,metadata_page,metadata_section',
      top: 5,
      queryType: 'semantic',
      semanticConfiguration: 'music-production-config',
      answers: 'extractive|count-3',
      captions: 'extractive|highlight-true',
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.searchApiKey,
      },
      body: JSON.stringify(searchBody),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const searchResults = await response.json();

    interface AzureSearchDoc {
      id: string;
      content: string;
      metadata_filename: string;
      metadata_page?: number;
      metadata_section?: string;
      '@search.score': number;
    }

    return (
      searchResults.value?.map((doc: AzureSearchDoc) => ({
        id: doc.id,
        content: doc.content,
        metadata: {
          filename: doc.metadata_filename,
          page: doc.metadata_page,
          section: doc.metadata_section,
        },
        score: doc['@search.score'],
      })) || []
    );
  }

  /**
   * Generate response using Azure OpenAI with retrieved context
   */
  private async generateResponse(
    query: string,
    retrievedDocs: DocumentChunk[],
    conversationHistory: Message[]
  ): Promise<RagResponse> {
    // Build context from retrieved documents
    const context = retrievedDocs
      .map((doc) => `Source: ${doc.metadata.filename}\n${doc.content}`)
      .join('\n\n---\n\n');

    // Build conversation history for context
    const recentHistory = conversationHistory
      .slice(-6) // Last 3 exchanges
      .map((msg) => `${msg.type}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are an expert music production assistant with access to a knowledge base of music production documents, guides, and resources.

Your expertise covers:
- Music production techniques and workflows
- DAW usage and best practices
- Audio engineering and mixing
- Music promotion and marketing
- Album artwork and visual design
- Equipment recommendations
- Industry insights and trends

Use the retrieved context below to provide detailed, accurate responses. Always cite your sources when referencing specific information from the documents.

Context from knowledge base:
${context}

Recent conversation:
${recentHistory}

Guidelines:
- Provide practical, actionable advice
- Reference specific techniques, tools, or strategies from the context
- If the context doesn't contain relevant information, use your general music production knowledge
- Always be encouraging and supportive
- Format your response clearly with sections if discussing multiple topics`;

    const completionUrl = `${this.endpoint}/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: query,
      },
    ];

    const response = await fetch(completionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    const completion = await response.json();
    const content =
      completion.choices[0]?.message?.content ||
      'I apologize, but I could not generate a response.';

    // Extract unique sources from retrieved documents
    const sources = [
      ...new Set(retrievedDocs.map((doc) => doc.metadata.filename)),
    ];

    return {
      content,
      sources,
    };
  }

  /**
   * Upload and process documents for the knowledge base
   */
  async uploadDocument(file: File): Promise<void> {
    try {
      // Step 1: Extract text content from file
      const textContent = await this.extractTextFromFile(file);

      // Step 2: Chunk the document
      const chunks = this.chunkDocument(textContent, file.name);

      // Step 3: Generate embeddings and upload to search index
      await this.indexDocumentChunks(chunks);
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error(`Failed to process ${file.name}`);
    }
  }

  /**
   * Extract text content from various file types
   */
  private async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();

    if (fileType.includes('text') || fileType.includes('markdown')) {
      return await file.text();
    }

    if (fileType.includes('pdf')) {
      // For PDF processing, you'd typically use a library like pdf-parse
      // For now, we'll throw an error to implement later
      throw new Error('PDF processing not implemented yet');
    }

    if (fileType.includes('word') || fileType.includes('docx')) {
      // For Word docs, you'd use a library like mammoth
      throw new Error('Word document processing not implemented yet');
    }

    // Fallback to treating as text
    return await file.text();
  }

  /**
   * Split document into chunks for better retrieval
   */
  private chunkDocument(content: string, filename: string): RawDocumentChunk[] {
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];

    let start = 0;
    let chunkIndex = 0;

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      const chunk = content.slice(start, end);

      chunks.push({
        id: `${filename}-chunk-${chunkIndex}`,
        content: chunk,
        metadata_filename: filename,
        metadata_section: `Chunk ${chunkIndex + 1}`,
      });

      start = end - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Index document chunks in Azure AI Search
   */
  private async indexDocumentChunks(chunks: RawDocumentChunk[]): Promise<void> {
    const indexUrl = `${this.searchEndpoint}/indexes/${this.indexName}/docs/index?api-version=2023-11-01`;

    const indexBody = {
      value: chunks.map((chunk) => ({
        '@search.action': 'upload',
        ...chunk,
      })),
    };

    const response = await fetch(indexUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.searchApiKey,
      },
      body: JSON.stringify(indexBody),
    });

    if (!response.ok) {
      throw new Error(`Indexing failed: ${response.statusText}`);
    }
  }

  /**
   * Create or update the search index schema
   */
  async createSearchIndex(): Promise<void> {
    const indexUrl = `${this.searchEndpoint}/indexes/${this.indexName}?api-version=2023-11-01`;

    const indexSchema = {
      name: this.indexName,
      fields: [
        {
          name: 'id',
          type: 'Edm.String',
          key: true,
          searchable: false,
          filterable: true,
          retrievable: true,
        },
        {
          name: 'content',
          type: 'Edm.String',
          searchable: true,
          filterable: false,
          retrievable: true,
          analyzer: 'standard',
        },
        {
          name: 'metadata_filename',
          type: 'Edm.String',
          searchable: true,
          filterable: true,
          retrievable: true,
        },
        {
          name: 'metadata_page',
          type: 'Edm.Int32',
          searchable: false,
          filterable: true,
          retrievable: true,
        },
        {
          name: 'metadata_section',
          type: 'Edm.String',
          searchable: true,
          filterable: true,
          retrievable: true,
        },
      ],
      semantic: {
        configurations: [
          {
            name: 'music-production-config',
            prioritizedFields: {
              titleField: { fieldName: 'metadata_filename' },
              prioritizedContentFields: [{ fieldName: 'content' }],
              // prioritizedKeywordsFields: [] // optional, you can remove this if you don't have keywords field
            },
          },
        ],
      },
    };

    const response = await fetch(indexUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.searchApiKey,
      },
      body: JSON.stringify(indexSchema),
    });

    if (!response.ok && response.status !== 204) {
      const errorBody = await response.text();
      console.error('Index creation failed body:', errorBody);
      throw new Error(`Index creation failed: ${response.statusText}`);
    }
  }
}

export const azureRagService = new AzureRagService();
