import { MainContent, Sidebar } from '@/components/Layout';
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
    // Add user message
    addMessage({
      type: 'user',
      content: message,
    });

    setLoading(true);

    // Simulate RAG response (replace with actual API call)
    setTimeout(() => {
      const response = {
        type: 'assistant' as const,
        content: `I understand you're asking about "${message}". Once the RAG system is connected, I'll be able to search through your uploaded documents and provide detailed, contextual responses about music creation, promotion, and album design.`,
        sources: uploadedFiles.length > 0 ? [uploadedFiles[0].name] : undefined,
      };

      addMessage(response);
      setLoading(false);
    }, 1500);
  };

  const handleFileUpload = (files: File[]) => {
    addFiles(files);
    setShowUpload(false);

    // Simulate file processing
    files.forEach((file, index) => {
      setTimeout(() => {
        const fileId = (Date.now() + index).toString();
        updateFileStatus(fileId, 'processed');
      }, 2000 + index * 500);
    });

    // Add confirmation message
    addMessage({
      type: 'assistant',
      content: `Great! I've received ${files.length} file(s): ${files.map(f => f.name).join(', ')}. These will be processed and added to my knowledge base for future queries.`,
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