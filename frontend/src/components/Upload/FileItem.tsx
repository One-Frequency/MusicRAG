import { UploadedFile } from '@/types';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Mic,
  X,
} from 'lucide-react';
import React from 'react';

interface FileItemProps {
  file: UploadedFile;
  onRemove: (fileId: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('audio/'))
      return <Mic className="w-4 h-4 text-green-500" />;
    if (type.startsWith('image/'))
      return <Image className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      {getFileIcon(file.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon(file.status)}
        <button
          onClick={() => onRemove(file.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
