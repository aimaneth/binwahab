import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export function CollectionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      image: formData.get("image") as string,
    };

    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create collection");
      }

      toast({
        title: "Success",
        description: "Collection created successfully",
      });

      router.refresh();
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Collection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
                name="name"
                placeholder="Collection name"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="slug">Slug</label>
              <Input
                id="slug"
                name="slug"
                placeholder="collection-slug"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Description</label>
              <Textarea
                id="description"
                name="description"
                placeholder="Collection description"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="image">Image URL</label>
              <Input
                id="image"
                name="image"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Collection"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 