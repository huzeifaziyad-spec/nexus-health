import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface PrescriptionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any | null;
}

export function PrescriptionDetailsDialog({ open, onOpenChange, prescription }: PrescriptionDetailsDialogProps) {
  if (!prescription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Prescription Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Patient</p>
              <p className="text-base">{prescription.patient?.full_name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date Issued</p>
              <p className="text-base">{format(new Date(prescription.$createdAt), "PPP")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Medication</p>
            <p className="text-lg font-semibold text-primary">{prescription.medicationName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Dosage</p>
              <div className="rounded-md bg-muted/50 p-2 text-sm">
                {prescription.dosage}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Frequency</p>
              <div className="rounded-md bg-muted/50 p-2 text-sm">
                {prescription.frequency}
              </div>
            </div>
          </div>

          {prescription.expirationDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Expiration Date</p>
              <p className="text-sm">{format(new Date(prescription.expirationDate), "PPP")}</p>
            </div>
          )}

          {prescription.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Instructions & Notes</p>
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="whitespace-pre-wrap">{prescription.notes}</p>
              </div>
            </div>
          )}

          {prescription.prescribingDoctor && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prescribing Physician</p>
                <p className="text-sm">Dr. {prescription.prescribingDoctor}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
