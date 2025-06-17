
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageFixUtility } from "@/components/admin/ImageFixUtility";
import { ImageIcon } from "lucide-react";

export const ImageManagementCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Management
        </CardTitle>
        <CardDescription>
          Fix and manage car image URLs for your listings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageFixUtility />
      </CardContent>
    </Card>
  );
};
