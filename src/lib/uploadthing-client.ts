import { createUploadthing, type FileRouter } from "uploadthing/next";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing";

const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

export { useUploadThing, uploadFiles }; 