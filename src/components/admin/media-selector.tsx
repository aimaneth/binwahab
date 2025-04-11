"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";

interface MediaSelectorProps {
  onSelect: (imageUrl: string) => void;
  trigger?: React.ReactNode;
}

interface Media {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

export function MediaSelector({ onSelect, trigger }: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<Media | null>(null);

  const fetchMedia = async (pageNum: number = 1, query: string = "") => {
    try {
      setLoading(true);
      
      // Ensure pageNum is a valid number
      const validPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
      
      console.log(`Fetching media: page=${validPage}, query=${query}`);
      
      const response = await fetch(`/api/admin/media?page=${validPage}&search=${query}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch media");
      }
      
      const data = await response.json();
      console.log("Media data received:", data);
      
      setMedia(data.media || []);
      
      // Get pagination data from the correct location in the response
      const { total, pages } = data.pagination || { total: 0, pages: 1 };
      
      // Calculate total pages based on total items and items per page
      const itemsPerPage = 12;
      
      // If we have 16 images total, we should have 2 pages (12 per page)
      const calculatedTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      console.log(`Total items: ${total}, Items per page: ${itemsPerPage}, Total pages: ${calculatedTotalPages}`);
      
      setTotalPages(calculatedTotalPages);
      
      // If we're on the last page and there are more pages, update the page number
      if (validPage > calculatedTotalPages && calculatedTotalPages > 0) {
        setPage(calculatedTotalPages);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load media library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia(1, searchQuery);
      setPage(1);
    }
  }, [isOpen, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    console.log(`Page change requested: ${newPage}, current page: ${page}, total pages: ${totalPages}`);
    
    // Ensure newPage is a valid number
    if (isNaN(newPage) || newPage < 1 || newPage > totalPages) {
      console.log(`Invalid page number: ${newPage}`);
      return;
    }
    
    console.log(`Changing to page ${newPage}`);
    setPage(newPage);
    fetchMedia(newPage, searchQuery);
  };

  // Add a debug effect to log state changes
  useEffect(() => {
    console.log(`State updated: page=${page}, totalPages=${totalPages}, mediaCount=${media.length}`);
  }, [page, totalPages, media.length]);

  const handleImageClick = (item: Media) => {
    setSelectedImage(item);
  };

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage.url);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Select from Media Library</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select from Media Library</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-square group cursor-pointer rounded-lg overflow-hidden border ${
                    selectedImage?.id === item.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleImageClick(item)}
                >
                  <Image
                    src={item.url}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {media.length > 0 && (
            <div className="py-4 flex justify-center border-t">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
        
        {selectedImage && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{selectedImage.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Size: {(selectedImage.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-sm text-muted-foreground">
                  Type: {selectedImage.type}
                </p>
              </div>
              <Button onClick={handleSelect}>
                Use This Image
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 