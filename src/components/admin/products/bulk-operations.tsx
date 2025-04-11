import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";

export function BulkOperations() {
  const [operation, setOperation] = useState<string>("import");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleExport = async (type: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products/bulk?type=${type}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      // Create a blob from the CSV data
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${type}-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Export completed successfully");
    } catch (error) {
      toast.error("Failed to export products");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("operation", operation);
      
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Operation failed");
      }
      
      const data = await response.json();
      setResults(data.results);
      
      toast.success("Operation completed successfully");
    } catch (error) {
      toast.error("Operation failed");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bulk Product Operations</CardTitle>
        <CardDescription>
          Import, export, or update multiple products at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import/Update</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Select
                  value={operation}
                  onValueChange={setOperation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import">Import Products</SelectItem>
                    <SelectItem value="status_update">Update Status</SelectItem>
                    <SelectItem value="category_assignment">Assign Categories</SelectItem>
                    <SelectItem value="price_update">Update Prices</SelectItem>
                    <SelectItem value="variant_creation">Create Variants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Download a template file to see the required format
                </p>
              </div>
              
              <Button type="submit" disabled={isLoading || !file}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? "Processing..." : "Upload & Process"}
              </Button>
            </form>
            
            {results.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium">Results</h3>
                <div className="max-h-60 overflow-auto rounded-md border p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Status</th>
                        <th className="text-left">ID/Name</th>
                        <th className="text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2">
                            {result.success ? (
                              <span className="text-green-600">Success</span>
                            ) : (
                              <span className="text-red-600">Failed</span>
                            )}
                          </td>
                          <td className="py-2">
                            {result.id || result.name || result.productId}
                          </td>
                          <td className="py-2">
                            {result.error || "Processed successfully"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-type">Export Type</Label>
                <Select
                  defaultValue="all"
                  onValueChange={(value) => handleExport(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select export type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="variants">Product Variants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={() => handleExport("all")}
                disabled={isLoading}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All Products
              </Button>
              
              <Button
                onClick={() => handleExport("variants")}
                disabled={isLoading}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Product Variants
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.open("/templates/product-import-template.csv", "_blank")}>
          Download Template
        </Button>
      </CardFooter>
    </Card>
  );
} 