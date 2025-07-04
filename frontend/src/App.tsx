import { MainContent, Sidebar } from '@/components/Layout';
import { azureRagService } from '@/services/azureRagService';
import { useChatStore } from '@/stores/chatStore';
import type { Message, UploadedFile } from '@/types';
import { useState } from 'react';

// Helper to generate a unique ID
const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substring(2);

function App() {
  const [showUpload, setShowUpload] = useState(false);

  const {
    messages,
    isLoading,
    uploadedFiles,
    addMessage,
    setLoading,
    addFiles,
    removeFile,
    updateFileStatus,
  } = useChatStore();

  const handleSendMessage = async (message: string) => {
    // Create full user message object
    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Build full history of messages, including new message
    const fullHistory: Message[] = [...messages, userMessage];

    setLoading(true);
    try {
      const ragResponse = await azureRagService.queryWithRag(
        message,
        fullHistory
      );

      // Add assistant message with all required fields
      const assistantMessage: Message = {
        id: generateId(),
        type: 'assistant',
        content: ragResponse.content,
        timestamp: new Date(),
        sources:
          ragResponse.sources && ragResponse.sources.length > 0
            ? ragResponse.sources
            : undefined,
      };
      addMessage(assistantMessage);
    } catch (error) {
      console.error('RAG query failed:', error);
      // Add error message, fully typed
      const errorMessage: Message = {
        id: generateId(),
        type: 'assistant',
        content:
          "I apologize, but I'm having trouble processing your request right now. Please check your connection and try again.",
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    // Wrap files into UploadedFile objects with initial status
    const filesWithMeta: UploadedFile[] = files.map((file) => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: 'uploading',
    }));
    addFiles(filesWithMeta);
    setShowUpload(false);

    // Feedback message for file processing
    const processingMessage: Message = {
      id: generateId(),
      type: 'assistant',
      content: `I'm processing ${files.length} file(s): ${files
        .map((f) => f.name)
        .join(', ')}. This may take a few moments...`,
      timestamp: new Date(),
    };
    addMessage(processingMessage);

    // Keep user updated as each file is processed
    const processResults: string[] = [];
    for (const uploaded of filesWithMeta) {
      try {
        updateFileStatus(uploaded.id, 'uploading');

        await azureRagService.uploadDocument(uploaded.file);

        updateFileStatus(uploaded.id, 'processed');
        processResults.push(`✓ ${uploaded.name}`);
      } catch (error) {
                console.error(`Failed to process file "${uploaded.name}"`, error);
        updateFileStatus(uploaded.id, 'error');
        processResults.push(`✗ ${uploaded.name} (error)`);
      }
    }

    // After processing all files, show results to user
    const finishedMessage: Message = {
      id: generateId(),
      type: 'assistant',
      content: `File processing finished:\n${processResults.join('\n')}`,
      timestamp: new Date(),
    };
    addMessage(finishedMessage);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        uploadedFiles={uploadedFiles}
        onFileUpload={handleFileUpload}
        onRemoveFile={removeFile}
        showUpload={showUpload}
        onToggleUpload={() => setShowUpload(!showUpload)}
      />
      <MainContent
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;