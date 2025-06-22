
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

interface AdditionalDocumentsUploadProps {
  file: File | null;
  documentType: string;
  uploadLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentTypeChange: (value: string) => void;
  onUpload: () => void;
}

export const AdditionalDocumentsUpload: React.FC<AdditionalDocumentsUploadProps> = ({
  file,
  documentType,
  uploadLoading,
  onFileChange,
  onDocumentTypeChange,
  onUpload
}) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Additional Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="documentType">Document Type</Label>
            <Select 
              value={documentType} 
              onValueChange={onDocumentTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">Dealer License</SelectItem>
                <SelectItem value="business-registration">Business Registration</SelectItem>
                <SelectItem value="tax-document">Tax Document</SelectItem>
                <SelectItem value="identity">Identity Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={onFileChange} 
              className="cursor-pointer"
            />
            {file && documentType !== 'utility-bill' && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={onUpload}
          disabled={!file || !documentType || documentType === 'utility-bill' || uploadLoading}
          variant="outline"
        >
          {uploadLoading ? "Uploading..." : "Upload Document"}
        </Button>
      </CardFooter>
    </Card>
  );
};
