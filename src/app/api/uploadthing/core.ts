import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 5
    } 
  })
    .middleware(async () => {
      // For development, allow uploads without authentication
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          console.log("No authenticated user, using default user ID");
          return { userId: "default-user" };
        }
        return { userId: session.user.id };
      } catch (error) {
        console.error("Auth error in uploadthing middleware:", error);
        return { userId: "default-user" };
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 