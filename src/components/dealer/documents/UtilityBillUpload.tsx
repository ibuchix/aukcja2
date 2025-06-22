
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Building2, AlertCircle, CheckCircle } from "lucide-react";

interface UtilityBillUploadProps {
  file: File | null;
  uploadLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

export const UtilityBillUpload: React.FC<UtilityBillUploadProps> = ({
  file,
  uploadLoading,
  onFileChange,
  onUpload
}) => {
  return (
    <Card className="mb-8 border-2 border-[#DC143C]/20">
      <CardHeader className="bg-[#DC143C]/5">
        <CardTitle className="flex items-center gap-2 text-[#DC143C]">
          <Building2 className="w-6 h-6" />
          Company Verification Required
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Verification Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            <strong>Please upload your company's utility bill for verification.</strong>
            <br />
            <span className="text-sm mt-2 block">
              • The utility bill must not be older than 3 months
              <br />
              • Accepted formats: PDF, JPG, PNG
              <br />
              • Maximum file size: 10MB
              <br />
              • The bill must clearly show your company name and address
            </span>
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="utilityBill" className="text-base font-semibold">
              Upload Company Utility Bill *
            </Label>
            <Input 
              id="utilityBill" 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFileChange}
              className="cursor-pointer mt-2"
            />
            {file && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={onUpload}
            disabled={!file || uploadLoading}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            {uploadLoading ? "Uploading..." : "Upload Utility Bill"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
