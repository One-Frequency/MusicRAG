import { FileItem, UploadArea } from '@/components/Upload';
import { UploadedFile } from '@/types';
import { Music } from 'lucide-react';
import React from 'react';

interface SidebarProps {
  uploadedFiles: UploadedFile[];
  onFileUpload: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  showUpload: boolean;
  onToggleUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
  showUpload,
  onToggleUpload,
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Music className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Music RAG</h1>
            <p className="text-sm text-gray-500">AI Music Assistant</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <UploadArea
        onFileUpload={onFileUpload}
        showUpload={showUpload}
        onToggleUpload={onToggleUpload}
      />

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Knowledge Base ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={onRemoveFile}
              />
            ))}
            {uploadedFiles.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No documents uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};