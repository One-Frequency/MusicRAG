import { Button } from '@/components/Common';
import { Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputMessage, setInputMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSend = () => {
    if (!inputMessage.trim() || isLoading) return;

    onSendMessage(inputMessage);
    setInputMessage('');

    // Multiple focus attempts to ensure it works
    requestAnimationFrame(() => {
      focusInput();
      setTimeout(focusInput, 10);
      setTimeout(focusInput, 100);
    });
  };

  // Refocus when loading changes from true to false
  useEffect(() => {
    if (!isLoading) {
      setTimeout(focusInput, 50);
    }
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about music production, promotion, album covers..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !inputMessage.trim()}
          className="flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};