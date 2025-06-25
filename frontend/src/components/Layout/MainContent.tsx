import { ChatInput, ChatMessages } from '@/components/Chat';
import { Message } from '@/types';
import React from 'react';

interface MainContentProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  messages,
  isLoading,
  onSendMessage,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Chat Assistant</h2>
        <p className="text-sm text-gray-500">
          Ask me anything about music creation, promotion, or album covers
        </p>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} isLoading={isLoading} />

      {/* Input */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};