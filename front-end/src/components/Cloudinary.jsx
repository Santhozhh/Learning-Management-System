import React, { useState } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from "@cloudinary/react";
import { fill } from "@cloudinary/url-gen/actions/resize";

const CloudinaryUpload = ({ onFileUpload, accept = "*/*" }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const cld = new Cloudinary({ cloud: { cloudName: "dt0p3mwea" } });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "lms_preset");
      formData.append("cloud_name", "dt0p3mwea");
      formData.append("resource_type", "auto"); // This allows any file type

      try {
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dt0p3mwea/auto/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Upload failed");
        }

        const data = await response.json();
        setSelectedFile(data.public_id);
        setFileUrl(data.secure_url);

        // Call the callback function with the file data
        if (onFileUpload) {
          onFileUpload({
            url: data.secure_url,
            publicId: data.public_id,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          });
        }
      } catch (error) {
        setError(error.message);
        console.error("Error uploading file:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <input
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {isUploading && (
          <div className="text-sm text-blue-600">Uploading...</div>
        )}

        {error && <div className="text-sm text-red-600">Error: {error}</div>}

        {selectedFile && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">File Details:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">File Name: {fileUrl.split('/').pop()}</p>
              {fileUrl && (
                <p className="text-sm text-gray-500 mt-2 break-all">
                  File URL: {fileUrl}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudinaryUpload;