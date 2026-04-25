import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface MedicalRecordDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any | null;
}

export function MedicalRecordDetailsDialog({ open, onOpenChange, record }: MedicalRecordDetailsDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Medical Record Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient</p>
              <p className="text-base">{record.patient?.full_name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
              <p className="text-base">{format(new Date(record.visitDate || new Date()), "PPP")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</p>
            <p className="text-base font-medium">{record.diagnosis || "General Checkup"}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Treatment Plan</p>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              {record.treatmentPlan ? (
                <p className="whitespace-pre-wrap">{record.treatmentPlan}</p>
              ) : (
                <p className="text-muted-foreground italic">No treatment plan specified.</p>
              )}
            </div>
          </div>

          {record.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Additional Notes</p>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="whitespace-pre-wrap">{record.notes}</p>
              </div>
            </div>
          )}

          {record.doctor && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attending Physician</p>
                <p className="text-sm">Dr. {record.doctor?.full_name || "Unknown"}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
