export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'uploading' | 'processed' | 'error';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  uploadedFiles: UploadedFile[];
}
