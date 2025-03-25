import React, { useState } from "react";

const FilePreview = ({ fileUrl, fileName, mimeType, fileId }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Determine file type
  const fileType = mimeType?.split('/')[0] || 'unknown';
  const fileExtension = fileName?.split('.').pop()?.toLowerCase() || '';
  const isPdf = fileExtension === 'pdf' || mimeType === 'application/pdf';
  const isImage = fileType === 'image';
  const isVideo = fileType === 'video';

  const handlePreviewClick = async (e) => {
    e.preventDefault();
    
    // Special handling for PDFs to download to temp and then view
    if (isPdf) {
      try {
        setIsDownloading(true);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileName || 'document.pdf');
        link.setAttribute('target', '_blank');
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // For Firefox, we can first download and then open using the blob URL
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // First trigger download
        link.href = blobUrl;
        link.click();
        
        // Then open in new tab for viewing
        setTimeout(() => {
          window.open(blobUrl, '_blank');
          window.URL.revokeObjectURL(blobUrl); // Clean up the blob URL
        }, 1000);
        
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error handling PDF:', error);
        // Fallback to regular open if there's an error
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } finally {
        setIsDownloading(false);
      }
    } else {
      // For non-PDFs, just open in a new tab
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Common wrapper with click handler for all file types
  const FileWrapper = ({ children }) => (
    <div 
      className="w-full h-48 relative cursor-pointer" 
      onClick={handlePreviewClick}
    >
      {children}
      {isDownloading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-4 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-sm font-medium">Preparing PDF...</span>
          </div>
        </div>
      )}
    </div>
  );

  // PDF Preview
  if (isPdf) {
    return (
      <FileWrapper>
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 384 512">
              <path d="M320 464c8.8 0 16-7.2 16-16V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320zM0 64C0 28.7 28.7 0 64 0H229.5c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64z"/>
              <path d="M111.5 270.7c-8.6-9.9-22.2-13.7-34.3-9.5s-20.5 16.7-20.5 29.5v121.4c0 12.8 8.4 24.1 20.5 28.3s25.6 .4 34.3-9.5l58.6-66.8c.8-.9 1.2-2.1 1.2-3.3s-.4-2.4-1.2-3.3l-58.6-66.8zM292.7 324.1c12.2-3.9 20.5-15.2 20.5-28s-8.4-24.1-20.5-28l-108.1-34.8c-5.9-1.9-12.1 1.3-14 7.2l-47.3 147.4c-1.9 5.9 1.3 12.1 7.2 14l108.1 34.8c12.2 3.9 25.4-1.5 31.2-12.9s2.6-25.8-7-33.2l.5-1.5 26.7 8.6c5.9 1.9 12.1-1.3 14-7.2s-1.3-12.1-7.2-14l-26.7-8.6 22.7-70.5z"/>
            </svg>
            <span className="mt-2 text-sm font-medium text-gray-700">Click to view PDF</span>
          </div>
        </div>
      </FileWrapper>
    );
  }

  // Image Preview
  if (isImage) {
    return (
      <FileWrapper>
        <img 
          src={fileUrl} 
          alt={fileName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '';
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full flex items-center justify-center bg-purple-50">
                <div class="flex flex-col items-center">
                  <svg class="w-16 h-16 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.19l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.2.25-.02.61.28.61h8.46c.3 0 .48-.36.29-.61l-2.32-3.02c-.2-.25-.58-.25-.78 0z" />
                  </svg>
                  <span class="mt-2 text-sm font-medium text-gray-700">Image unavailable</span>
                </div>
              </div>
            `;
          }}
        />
      </FileWrapper>
    );
  }

  // Video Preview
  if (isVideo) {
    return (
      <FileWrapper>
        <video 
          src={fileUrl}
          className="w-full h-full object-contain"
          controls
          poster={`https://res.cloudinary.com/dt0p3mwea/video/upload/so_0/v${Math.floor(Math.random() * 1000)}/${fileId}.jpg`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full flex items-center justify-center bg-blue-50">
                <div class="flex flex-col items-center">
                  <svg class="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                  <span class="mt-2 text-sm font-medium text-gray-700">Video preview unavailable</span>
                </div>
              </div>
            `;
          }}
          onClick={(e) => {
            e.stopPropagation(); // Don't show options when clicking video controls
          }}
        ></video>
      </FileWrapper>
    );
  }

  // Default Preview (for other file types)
  return (
    <FileWrapper>
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          </svg>
          <span className="mt-2 text-sm font-medium text-gray-700">{fileExtension.toUpperCase() || 'File'}</span>
          <span className="text-xs text-gray-500 mt-1">Click to download</span>
        </div>
      </div>
    </FileWrapper>
  );
};

export default FilePreview; 