
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { DealerDocument } from "@/services/dealerProfileManagementService";

interface UploadedDocumentsListProps {
  documents: DealerDocument[];
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

export const UploadedDocumentsList: React.FC<UploadedDocumentsListProps> = ({
  documents
}) => {
  return (
    <>
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
    </>
  );
};
