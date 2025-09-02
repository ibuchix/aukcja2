
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
    <Card className="mb-8 bg-secondary border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-body-text">
          <Upload className="w-5 h-5 text-iris" />
          Prześlij dodatkowe dokumenty
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="documentType">Typ dokumentu</Label>
            <Select 
              value={documentType} 
              onValueChange={onDocumentTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz typ dokumentu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="license">Licencja dealera</SelectItem>
                <SelectItem value="business-registration">Rejestracja działalności</SelectItem>
                <SelectItem value="tax-document">Dokument podatkowy</SelectItem>
                <SelectItem value="identity">Dokument tożsamości</SelectItem>
                <SelectItem value="other">Inne</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="file">Wybierz plik</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={onFileChange} 
              className="cursor-pointer"
            />
            {file && documentType !== 'utility-bill' && (
              <p className="mt-2 text-sm text-subtitle-text">
                Wybrano: {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
          {uploadLoading ? "Przesyłanie..." : "Prześlij dokument"}
        </Button>
      </CardFooter>
    </Card>
  );
};
