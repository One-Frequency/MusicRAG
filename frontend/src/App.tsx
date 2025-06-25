// App.tsx
import { MainContent, Sidebar } from '@/components/Layout';
import { azureRagService } from '@/services/azureRagService';
import { useChatStore } from '@/stores/chatStore';
import { useState } from 'react';

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
    // Add user message immediately
    addMessage({
      type: 'user',
      content: message,
    });

    setLoading(true);

    try {
      // Use Azure RAG service for response
      const ragResponse = await azureRagService.queryWithRag(message, messages);

      // Add assistant response with sources
      addMessage({
        type: 'assistant',
        content: ragResponse.content,
        sources: ragResponse.sources.length > 0 ? ragResponse.sources : undefined,
      });
    } catch (error) {
      console.error('RAG query failed:', error);

      // Add error message
      addMessage({
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    // Add files to store immediately
    addFiles(files);
    setShowUpload(false);

    // Add initial confirmation message
    addMessage({
      type: 'assistant',
      content: `I'm processing ${files.length} file(s): ${files.map(f => f.name).join(', ')}. This may take a few moments...`,
    });

    // Process each file
    const processResults = [];

    for (const file of files) {
      try {
        // Find the file ID (this is a bit hacky, you might want to return IDs from addFiles)
        const fileId = (Date.now() + Math.random()).toString();

        // Update status to processing
        updateFileStatus(fileId, 'uploading');

        // Upload to Azure RAG service
        await azureRagService.uploadDocument(file);

        // Update status to processed
        updateFileStatus(fileId, 'processed');

        processResults.push(`✓ ${file.name}`);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);

        // Find file ID and update status to error
        const errorFile = uploadedFiles.find(f => f.name === file.name);
        if (errorFile) {
          updateFileStatus(errorFile.id, 'error');
        }

        processResults.push(`✗ ${file.name} (processing failed)`);
      }
    }

    // Add final status message
    addMessage({
      type: 'assistant',
      content: `File processing complete:\n\n${processResults.join('\n')}\n\nYour documents have been added to my knowledge base and I can now reference them when answering your music production questions!`,
    });
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