import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, AlertCircle, Upload, CheckCircle, XCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoyaltyAgreementForm } from "@/components/dealer/documents/LoyaltyAgreementForm";
import { 
  getDealerDocuments, 
  uploadDealerDocument, 
  DealerDocument 
} from "@/services/dealerProfileManagementService";

export default function DealerDocuments() {
  const [documents, setDocuments] = useState<DealerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      fetchDocuments();
    };
    checkAuth();
  }, [navigate]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const result = await getDealerDocuments();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type for utility bills
      if (documentType === 'utility-bill') {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
          toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Utility bills must be in PDF, JPG, or PNG format"
          });
          return;
        }
        
        // Check file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: "File size must be less than 10MB"
          });
          return;
        }
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file and document type"
      });
      return;
    }

    try {
      setUploadLoading(true);
      const result = await uploadDealerDocument({
        file,
        documentType
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
        variant: "default"
      });
      
      // Reset form
      setFile(null);
      setDocumentType("");
      
      // Refresh documents list
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Document Management</h1>
        
        {/* Utility Bill Upload Section - Priority */}
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
                  onChange={(e) => {
                    setDocumentType('utility-bill');
                    handleFileChange(e);
                  }}
                  className="cursor-pointer mt-2"
                />
                {file && documentType === 'utility-bill' && (
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
                onClick={handleUpload}
                disabled={!file || documentType !== 'utility-bill' || uploadLoading}
                className="bg-[#DC143C] hover:bg-[#DC143C]/90"
              >
                {uploadLoading ? "Uploading..." : "Upload Utility Bill"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Other Documents Upload Section */}
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
                  onValueChange={setDocumentType}
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
                  onChange={handleFileChange} 
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
              onClick={handleUpload}
              disabled={!file || !documentType || documentType === 'utility-bill' || uploadLoading}
              variant="outline"
            >
              {uploadLoading ? "Uploading..." : "Upload Document"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Loyalty Agreement Form Section */}
        <div className="mb-8">
          <LoyaltyAgreementForm />
        </div>
        
        {/* Document list */}
        <h2 className="text-2xl font-semibold mb-4">Uploaded Documents</h2>
        <div className="grid gap-6">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No documents found</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {getDocumentTypeName(doc.document_type)}
                    {doc.document_type === 'utility-bill' && (
                      <span className="ml-2 px-2 py-1 bg-[#DC143C]/10 text-[#DC143C] text-xs rounded-full">
                        PRIORITY
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">File Name</p>
                      <p className="font-semibold truncate">{doc.file_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">File Type</p>
                      <p className="font-semibold capitalize">{doc.file_type.split('/').pop()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Verification Status</p>
                      <div className="flex items-center gap-1">
                        {doc.verified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-amber-600" />
                            <span className="font-semibold text-amber-600">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Upload Date</p>
                      <p className="font-semibold">
                        {format(new Date(doc.uploaded_at), 'PP')}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (doc.signedUrl) {
                            window.open(doc.signedUrl, '_blank');
                          }
                        }}
                        disabled={!doc.signedUrl}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getDocumentTypeName(type: string): string {
  const types: Record<string, string> = {
    'utility-bill': 'Company Utility Bill',
    'license': 'Dealer License',
    'business-registration': 'Business Registration',
    'tax-document': 'Tax Document',
    'identity': 'Identity Document',
    'other': 'Other Document'
  };
  
  return types[type] || 'Document';
}
