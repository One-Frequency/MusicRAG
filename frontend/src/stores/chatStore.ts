import { ChatState, Message, UploadedFile } from '@/types';
import { create } from 'zustand';

interface ChatStore extends ChatState {
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (fileId: string) => void;
  updateFileStatus: (
    fileId: string,
    status: 'uploading' | 'processed' | 'error'
  ) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [
    {
      id: '1',
      type: 'assistant',
      content:
        "Hi! I'm your music creation assistant. Upload some documents or ask me anything about music production, promotion, or album covers.",
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  uploadedFiles: [],

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  addFiles: (files) =>
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, ...files],
    })),

  removeFile: (fileId) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
    })),

  updateFileStatus: (fileId, status) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((file) =>
        file.id === fileId ? { ...file, status } : file
      ),
    })),
}));
