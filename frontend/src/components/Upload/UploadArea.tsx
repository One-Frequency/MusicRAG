import { Button } from '@/components/Common';
import { Plus, Upload } from 'lucide-react';
import React, { useRef } from 'react';

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void;
  showUpload: boolean;
  onToggleUpload: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileUpload,
  showUpload,
  onToggleUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  return (
    <div className="border-b border-gray-200">
      <div className="p-4">
        <Button
          onClick={onToggleUpload}
          className="w-full"
          variant="primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {showUpload && (
        <div className="p-4 bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.doc,.docx,.mp3,.wav,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-white transition-colors"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">Choose files to upload</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Supports: PDF, TXT, MD, DOC, MP3, WAV, Images
          </p>
        </div>
      )}
    </div>
  );
};