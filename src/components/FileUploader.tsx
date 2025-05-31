import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { ControllerRenderProps, FieldValues, FieldPath } from "react-hook-form";

interface FileUploaderProps<TFieldValues extends FieldValues = FieldValues> {
  id: string;
  label: string;
  field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>;
  multiple?: boolean;
}

const FileUploader = <TFieldValues extends FieldValues = FieldValues>({
  id,
  label,
  field,
  multiple,
}: FileUploaderProps<TFieldValues>) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(event.target.files);
  };

  // Ensure field.value is always a FileList or null for consistency
  const selectedFiles = (field.value as unknown) instanceof FileList ? (field.value as FileList) : null;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        multiple={multiple}
        onChange={handleFileChange}
        // Note: File input value is read-only, so we don't bind field.value to it directly.
        // The selected files are managed via field.onChange and accessed via field.value.
      />
      {selectedFiles && selectedFiles.length > 0 && (
        <div className="mt-2">
          <Label>Selected Files:</Label>
          <ul className="list-disc list-inside">
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index} className="flex items-center justify-between text-sm text-gray-700">
                {file.name}
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = new DataTransfer();
                    Array.from(selectedFiles).forEach((f, i) => {
                      if (i !== index) {
                        newFiles.items.add(f);
                      }
                    });
                    field.onChange(newFiles.files.length > 0 ? newFiles.files : null);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;