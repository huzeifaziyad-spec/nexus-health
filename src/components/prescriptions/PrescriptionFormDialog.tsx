import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ID } from "appwrite";
import { useAuth } from "@/contexts/AuthContext";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PrescriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordToEdit?: any;
}

export function PrescriptionFormDialog({ open, onOpenChange, recordToEdit }: PrescriptionFormDialogProps) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.profiles,
      );
      // Fallback filter to only show patients or all profiles if roles are not strictly enforced
      return res.documents.filter(doc => !doc.role || doc.role === "patient");
    },
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: recordToEdit?.patientId || "",
      medicationName: recordToEdit?.medicationName || "",
      dosage: recordToEdit?.dosage || "",
      frequency: recordToEdit?.frequency || "",
      expirationDate: recordToEdit?.expirationDate ? new Date(recordToEdit.expirationDate).toISOString().split('T')[0] : "",
      notes: recordToEdit?.notes || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (recordToEdit) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.prescriptions,
          recordToEdit.$id,
          {
            medicationName: data.medicationName,
            dosage: data.dosage,
            frequency: data.frequency,
            expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
            notes: data.notes,
          }
        );
        toast.success("Prescription updated successfully");
      } else {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.prescriptions,
          ID.unique(),
          {
            patientId: data.patientId,
            prescribingDoctor: `${profile?.firstName} ${profile?.lastName}`,
            medicationName: data.medicationName,
            dosage: data.dosage,
            frequency: data.frequency,
            expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
            notes: data.notes,
          }
        );
        toast.success("Prescription issued successfully");

        // Create notification for the patient
        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.notifications || "notifications",
            ID.unique(),
            {
              userId: data.patientId,
              title: "New Prescription",
              message: `Dr. ${profile?.firstName} ${profile?.lastName} issued a new prescription: ${data.medicationName}.`,
              type: "prescription",
              isRead: false,
              link: "/prescriptions"
            },
            [
              `read("user:${data.patientId}")`,
              `update("user:${data.patientId}")`,
              `delete("user:${data.patientId}")`
            ]
          );
        } catch (e) {
          console.error("Failed to send notification:", e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{recordToEdit ? "Edit Prescription" : "Issue New Prescription"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!recordToEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.$id} value={patient.$id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Amoxicillin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 500mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Twice a day" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions / Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Take with food..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Prescription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
