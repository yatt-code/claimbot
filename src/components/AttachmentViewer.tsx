import React from 'react';
import Link from 'next/link'; // Assuming we'll use Next.js Link for file links

// Define an interface for attachment objects based on the File schema in SDS
export interface Attachment {
  _id: string;
  filename: string;
  mimetype: string;
  path: string; // The path to the file (might be internal or a URL)
  // Add other fields if needed
}

interface AttachmentViewerProps {
  attachments: Attachment[];
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Attachments
        </h3>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {attachments.length === 0 ? (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">No attachments</dt>
            </div>
          ) : (
            attachments.map(attachment => (
              <div key={attachment._id} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">File</dt>
                <dd className="mt-1 text-sm text-blue-600 hover:underline sm:mt-0 sm:col-span-2">
                  {/* TODO: Use the correct path or API endpoint for file download/view */}
                  <Link href={`/api/files/${attachment._id}`} target="_blank" rel="noopener noreferrer">
                    {attachment.filename}
                  </Link>
                </dd>
              </div>
            ))
          )}
        </dl>
      </div>
    </div>
  );
};

export default AttachmentViewer;