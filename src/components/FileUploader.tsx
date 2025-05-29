import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

interface FileUploaderProps {
  id: string;
  label: string;
  onChange: (files: FileList | null) => void;
  multiple?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ id, label, onChange, multiple }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="file" multiple={multiple} onChange={handleFileChange} />
      {/* TODO: Add file preview and removal functionality */}
    </div>
  );
};

export default FileUploader;