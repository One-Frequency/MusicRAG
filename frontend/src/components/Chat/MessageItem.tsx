import { Message } from '@/types';
import React from 'react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-lg px-4 py-3 ${
        message.type === 'user'
          ? 'bg-purple-600 text-white'
          : 'bg-white border border-gray-200 text-gray-900'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Sources: {message.sources.join(', ')}
            </p>
          </div>
        )}
        <p className={`text-xs mt-2 ${
          message.type === 'user' ? 'text-purple-200' : 'text-gray-400'
        }`}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};