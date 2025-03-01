
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SqlApprovalDialogProps {
  sql: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
}

export function SqlApprovalDialog({
  sql,
  isOpen,
  onOpenChange,
  onApprove,
}: SqlApprovalDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve SQL Migration</DialogTitle>
          <DialogDescription>
            Please review the SQL migration below and approve if it looks correct.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {sql}
          </pre>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onApprove}>Approve Migration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
