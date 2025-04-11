import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const { POST } = createRouteHandler({
  router: ourFileRouter,
});
