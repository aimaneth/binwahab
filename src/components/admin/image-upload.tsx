"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadThing } from "@/lib/uploadthing-client";
import { toast } from "@/components/ui/use-toast";
import { MediaSelector } from "./media-selector";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ images, onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("imageUploader");

  const handleUpload = async (files: File[]) => {
    if (uploading) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = await startUpload(files);
      if (uploadedFiles) {
        const newImages = [...images, ...uploadedFiles.map((file) => file.url)];
        onChange(newImages.slice(0, maxFiles));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await handleUpload(acceptedFiles);
  }, [uploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: maxFiles - images.length,
    disabled: uploading || images.length >= maxFiles,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const handleMediaSelect = (imageUrl: string) => {
    if (images.length >= maxFiles) {
      toast({
        title: "Maximum Images Reached",
        description: `You can only upload up to ${maxFiles} images.`,
        variant: "destructive",
      });
      return;
    }
    onChange([...images, imageUrl]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div
          {...getRootProps()}
          className={`
            flex-1 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
            ${uploading || images.length >= maxFiles ? "opacity-50 cursor-not-allowed" : "hover:border-primary"}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the files here"
              : "Drag & drop images here, or click to select files"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {images.length}/{maxFiles} images
          </p>
        </div>
        <MediaSelector
          onSelect={handleMediaSelect}
          trigger={
            <Button
              variant="outline"
              className="h-full"
              disabled={uploading || images.length >= maxFiles}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Library
            </Button>
          }
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 