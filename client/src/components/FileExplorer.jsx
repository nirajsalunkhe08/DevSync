import { FileCode, FileText, Image } from 'lucide-react';

const FileExplorer = ({ files, onFileClick }) => {
  
  const getIcon = (mimeType) => {
    if (mimeType && mimeType.includes('image')) return <Image className="text-purple-500" />;
    if (mimeType && (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('text'))) return <FileCode className="text-yellow-500" />;
    return <FileText className="text-blue-500" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <div 
          key={file._id} 
          className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex items-center justify-between cursor-pointer border border-gray-100"
          onClick={() => onFileClick(file)}
        >
          <div className="flex items-center gap-3">
            {getIcon(file.fileType)}
            <div>
              <p className="font-semibold text-gray-800 truncate w-40" title={file.name}>{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        </div>
      ))}
      
      {files.length === 0 && (
        <p className="text-gray-400 text-center col-span-full py-10">No files yet. Upload one above!</p>
      )}
    </div>
  );
};

export default FileExplorer;