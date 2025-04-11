import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadButton, UploadDropzone, Uploader } from "@uploadthing/react";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 5
    } 
  })
    .middleware(async () => {
      // This is a simplified middleware that doesn't require authentication
      // In production, you should use proper authentication
      return { userId: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Export the components and types
export { UploadButton, UploadDropzone, Uploader }; 