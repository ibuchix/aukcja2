
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, AlertCircle, Upload, CheckCircle, XCircle } from "lucide-react";
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
      setFile(e.target.files[0]);
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
        <h1 className="text-3xl font-bold mb-6">Zarządzanie Dokumentami</h1>
        
        {/* Loyalty Agreement Form Section */}
        <div className="mb-8">
          <LoyaltyAgreementForm />
        </div>
        
        {/* Upload section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Prześlij Dokument
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="documentType">Typ Dokumentu</Label>
                <Select 
                  value={documentType} 
                  onValueChange={setDocumentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ dokumentu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="license">Licencja Dealera</SelectItem>
                    <SelectItem value="business-registration">Rejestracja Działalności</SelectItem>
                    <SelectItem value="tax-document">Dokument Podatkowy</SelectItem>
                    <SelectItem value="identity">Dokument Tożsamości</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">Wybierz Plik</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  className="cursor-pointer"
                />
                {file && (
                  <p className="mt-2 text-sm text-subtitle-text">
                    Wybrany: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={!file || !documentType || uploadLoading}
            >
              {uploadLoading ? "Przesyłanie..." : "Prześlij Dokument"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Document list */}
        <h2 className="text-2xl font-semibold mb-4">Przesłane Dokumenty</h2>
        <div className="grid gap-6">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-subtitle-text">Nie znaleziono dokumentów</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {getDocumentTypeName(doc.document_type)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-subtitle-text">Nazwa Pliku</p>
                      <p className="font-semibold truncate">{doc.file_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Typ Pliku</p>
                      <p className="font-semibold capitalize">{doc.file_type.split('/').pop()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Status Weryfikacji</p>
                      <div className="flex items-center gap-1">
                        {doc.verified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="font-semibold text-success">Zweryfikowany</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-warning" />
                            <span className="font-semibold text-warning">Oczekuje</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Data Przesłania</p>
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
                        Zobacz Dokument
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
    'license': 'Licencja Dealera',
    'business-registration': 'Rejestracja Działalności',
    'tax-document': 'Dokument Podatkowy',
    'identity': 'Dokument Tożsamości',
    'other': 'Inny Dokument'
  };
  
  return types[type] || 'Dokument';
}
