// services/azureRagService.ts

import { Message } from '@/types';
import { fetchAuthSession } from 'aws-amplify/auth';

export interface RagResponse {
  content: string;
  sources: string[];
}

class AzureRagService {
  /**
   * Get authorization headers with JWT token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (token) {
        return {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Upload a document to the backend for ingestion.
   * Currently a stub so the frontend compiles; replace with real implementation once
   * the backend exposes an endpoint for uploads.
   */
  async uploadDocument(file: File): Promise<void> {
    // TODO: replace with real API call
    console.warn(
      '[AzureRagService] uploadDocument called, but no endpoint is implemented.',
      file.name
    );
    return Promise.resolve();
  }

  /**
   * Main RAG query method - sends the query and conversation to your Go GraphQL backend
   */
  async queryWithRag(
    query: string,
    conversationHistory: Message[] = []
  ): Promise<RagResponse> {
    const headers = await this.getAuthHeaders();

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        conversationHistory: conversationHistory.map((msg) => ({
          type: msg.type,
          content: msg.content,
        })),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Chat retrieval failed: ${errorText}`);
    }

    return res.json();
  }

  /*
    OPTIONAL: If you need to adapt document upload/chunking functions,
    see notes below. Here, we keep them as stubs until your backend
    exposes GraphQL endpoints/mutations for document handling.
  */
  // azureRagService = {
  //   uploadDocument: async (file: File[]): Promise<void> => {
  //     // Eventually implement upload
  //     throw new Error('Document upload via GraphQL not yet implemented.');
  //   },
  // };
}

export const azureRagService = new AzureRagService();
