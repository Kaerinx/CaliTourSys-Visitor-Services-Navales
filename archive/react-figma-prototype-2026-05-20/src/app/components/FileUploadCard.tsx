import { useId, useRef, type DragEvent } from "react";
import { cn } from "../../lib/utils";
import { Upload, File as FileIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface FileUploadCardProps {
  title: string;
  description?: string;
  acceptedFileTypes?: string;
  maxFileSize?: string;
  file?: {
    name: string;
    status: "uploading" | "success" | "error" | "revision";
    errorMessage?: string;
    revisionRemarks?: string;
  };
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  required?: boolean;
}

export function FileUploadCard({
  title,
  description,
  acceptedFileTypes = "PDF, JPG, PNG",
  maxFileSize = "10MB",
  file,
  onUpload,
  onRemove,
  required,
}: FileUploadCardProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = acceptedFileTypes
    .split(",")
    .map((type) => `.${type.trim().toLowerCase()}`)
    .join(",");

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = (selectedFile?: File) => {
    if (!selectedFile) {
      return;
    }

    onUpload?.(selectedFile);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFileSelect(event.dataTransfer.files[0]);
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={acceptedExtensions}
        disabled={!onUpload}
        className="sr-only"
        onChange={(event) => handleFileSelect(event.target.files?.[0])}
      />

      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="flex items-center gap-1">
            {title}
            {required && <span className="text-destructive">*</span>}
          </h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {!file ? (
        <div
          role={onUpload ? "button" : undefined}
          tabIndex={onUpload ? 0 : undefined}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            {
              "cursor-pointer hover:border-[var(--color-gov-blue)] hover:bg-accent":
                onUpload,
            }
          )}
          onClick={onUpload ? openFilePicker : undefined}
          onKeyDown={(event) => {
            if (onUpload && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onUpload ? handleDrop : undefined}
        >
          <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptedFileTypes} (max {maxFileSize})
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "border rounded-lg p-4",
            {
              "border-[var(--status-approved)] bg-[var(--status-approved-bg)]":
                file.status === "success",
              "border-[var(--status-rejected)] bg-[var(--status-rejected-bg)]":
                file.status === "error",
              "border-[var(--status-revision)] bg-[var(--status-revision-bg)]":
                file.status === "revision",
              "border-border bg-card": file.status === "uploading",
            }
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn("flex items-center justify-center size-10 rounded shrink-0", {
                "bg-[var(--status-approved)] text-white":
                  file.status === "success",
                "bg-[var(--status-rejected)] text-white":
                  file.status === "error",
                "bg-[var(--status-revision)] text-white":
                  file.status === "revision",
                "bg-muted": file.status === "uploading",
              })}
            >
              {file.status === "uploading" && (
                <Loader2 className="size-5 animate-spin" />
              )}
              {file.status === "success" && <CheckCircle className="size-5" />}
              {file.status === "error" && <XCircle className="size-5" />}
              {file.status === "revision" && <FileIcon className="size-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              {file.status === "uploading" && (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              )}
              {file.status === "success" && (
                <p className="text-xs text-[var(--status-approved)]">
                  Upload successful
                </p>
              )}
              {file.status === "error" && (
                <p className="text-xs text-[var(--status-rejected)]">
                  {file.errorMessage || "Upload failed"}
                </p>
              )}
              {file.status === "revision" && (
                <p className="text-xs text-[var(--status-revision)]">
                  Needs revision
                </p>
              )}
            </div>

            {file.status !== "uploading" && (onUpload || onRemove) ? (
              <div className="flex items-center gap-2">
                {onUpload && (
                  <Button variant="outline" size="sm" onClick={openFilePicker}>
                    Replace File
                  </Button>
                )}
                {onRemove && (
                  <Button variant="ghost" size="sm" onClick={onRemove}>
                    Remove
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {file.status === "revision" && file.revisionRemarks && (
            <div className="mt-3 pt-3 border-t border-[var(--status-revision)]">
              <p className="text-xs font-medium text-[var(--status-revision)] mb-1">
                Staff Remarks:
              </p>
              <p className="text-xs text-muted-foreground">
                {file.revisionRemarks}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Accepted formats: {acceptedFileTypes} • Max size: {maxFileSize}
      </p>
    </div>
  );
}
