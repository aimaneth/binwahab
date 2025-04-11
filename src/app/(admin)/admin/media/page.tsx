"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Image as ImageIcon, Trash2, MoreHorizontal, X, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Image from "next/image";
import { Pagination } from "@/components/ui/pagination";
import { formatDistanceToNow } from "date-fns";
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import type { ClientUploadedFileData } from "uploadthing/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUploadThing } from "@/lib/uploadthing-client";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface Media {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function MediaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [media, setMedia] = useState<Media[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 12,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDropzoneRef = useRef<any>(null);
  const { startUpload } = useUploadThing("imageUploader");
  
  // Add a debug function
  const debugLog = (message: string, data?: any) => {
    console.log(`[Media Upload] ${message}`, data || '');
  };

  const handleUploadComplete = async (res: any[] | undefined) => {
    debugLog("Upload complete, received response:", res);
    if (!res || res.length === 0) {
      debugLog("No files were uploaded successfully");
      toast.error("No files were uploaded successfully");
      setIsUploading(false);
      setUploadingFiles([]);
      setSelectedFiles([]);
      return;
    }

    try {
      // Keep the loading state active while we save to the database
      debugLog(`Processing ${res.length} uploaded files...`);
      toast.info(`Processing ${res.length} uploaded files...`);
      
      // Process each uploaded file
      for (const file of res) {
        debugLog("Processing file:", file);
        
        // Save to database
        debugLog(`Saving file to database: ${file.name}`);
        const response = await fetch("/api/admin/media", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            url: file.url,
            type: file.type || "image/jpeg", // Default to jpeg if type is not provided
            size: file.size || 0, // Default to 0 if size is not provided
            width: 0,
            height: 0,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          debugLog(`Error saving media: ${errorText}`);
          console.error("Error saving media:", errorText);
          toast.error(`Failed to save ${file.name}: ${errorText}`);
          continue;
        }
        
        const savedMedia = await response.json();
        debugLog("Media saved successfully:", savedMedia);
        
        // Add the new media to the state
        setMedia(prev => [savedMedia, ...prev]);
      }
      
      toast.success("Files uploaded successfully");
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Error processing uploads:", error);
      toast.error("Failed to process uploads");
    } finally {
      setIsUploading(false);
      setUploadingFiles([]);
      setUploadProgress(0);
      setSelectedFiles([]);
    }
  };

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/media?search=${searchQuery}&page=${pagination.page}&limit=${pagination.limit}`
      );
      if (!response.ok) throw new Error("Failed to fetch media");
      const data = await response.json();
      setMedia(data.media);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Failed to fetch media");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [searchQuery, pagination.page, pagination.limit]);

  // Add a debug log when the upload modal is opened
  useEffect(() => {
    if (isUploadModalOpen) {
      console.log("[Media Upload] Upload modal opened");
      console.log("[Media Upload] UploadThing API keys:", {
        secret: process.env.NEXT_PUBLIC_UPLOADTHING_SECRET ? "Set" : "Not set",
        appId: process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID ? "Set" : "Not set",
      });
    }
  }, [isUploadModalOpen]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete media");
      toast.success("Media deleted successfully");
      fetchMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error("Failed to delete media");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      debugLog("Files selected via input:", files);
    }
  };

  // Function to handle file drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      debugLog("Files dropped:", files);
    }
  };

  // Function to handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to remove a file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Function to clear all selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Use the UploadThing client to handle the upload
      const uploadResponse = await startUpload(selectedFiles);
      
      if (!uploadResponse || uploadResponse.length === 0) {
        throw new Error('Upload failed');
      }
      
      // Process the uploaded files
      handleUploadComplete(uploadResponse);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage your media files and assets.
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search media..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative aspect-video">
                      <ImageWithFallback
                        src={item.url}
                        alt={item.name}
                        width={400}
                        height={300}
                        className="object-cover w-full h-full"
                        type="product"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(item.size)}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) =>
                      setPagination((prev) => ({ ...prev, page }))
                    }
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
        setIsUploadModalOpen(open);
        if (!open) {
          // Reset state when closing
          setTimeout(() => {
            setIsUploading(false);
            setUploadingFiles([]);
            setUploadProgress(0);
            setSelectedFiles([]);
          }, 300);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload images to your media library. Drag and drop files or click to browse.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Uploading files...</p>
                {uploadingFiles.length > 0 && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground">Uploading {uploadingFiles.length} files</p>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-right text-muted-foreground">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center bg-muted/10"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileSelect}
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium">Drag and drop images here</p>
                      <p className="text-xs text-muted-foreground">or</p>
                      <Button 
                        variant="default" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Click to select files
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum file size: 4MB • Maximum files: 5</p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Selected files:</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearSelectedFiles}
                        className="h-8 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-1 hover:bg-muted/50 rounded">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[80%]">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full mt-2" 
                      onClick={handleUpload}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadModalOpen(false);
                // Reset upload state when closing
                setTimeout(() => {
                  setIsUploading(false);
                  setUploadingFiles([]);
                  setUploadProgress(0);
                  setSelectedFiles([]);
                }, 300);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 