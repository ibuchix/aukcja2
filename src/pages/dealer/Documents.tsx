
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Document {
  id: string;
  car_id: string;
  file_path: string;
  file_type: string;
  upload_status: string;
  created_at: string;
  car: {
    title: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  };
}

export default function DealerDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        // Since we don't have service_history_files in the database yet, 
        // we'll just load the cars and show a message that no documents are available
        const { data: cars, error } = await supabase
          .from('cars')
          .select('id, title, make, model, year')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // For now, we're creating an empty document list
        setDocuments([]);
        
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

    fetchDocuments();
  }, [navigate, toast]);

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('car-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download file"
      });
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
        <h1 className="text-3xl font-bold mb-6">My Documents</h1>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>
            Document management functionality is currently being developed. You will be able to upload and view car service history documents here soon.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-6">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-subtitle-text">No documents found</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {doc.car.year} {doc.car.make} {doc.car.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-subtitle-text">File Type</p>
                      <p className="font-semibold capitalize">{doc.file_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Status</p>
                      <p className="font-semibold capitalize">{doc.upload_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-subtitle-text">Upload Date</p>
                      <p className="font-semibold">
                        {format(new Date(doc.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.file_path)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
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
