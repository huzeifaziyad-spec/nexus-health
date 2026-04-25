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
  profileId: z.string().min(1, "Patient is required"),
  diagnosis: z.string().min(2, "Diagnosis must be at least 2 characters"),
  treatmentPlan: z.string().min(5, "Treatment plan must be at least 5 characters"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MedicalRecordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordToEdit?: any; // If provided, we are in edit mode
}

export function MedicalRecordFormDialog({ open, onOpenChange, recordToEdit }: MedicalRecordFormDialogProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      // Assuming a generic fetch of all profiles, we can filter by role client-side if needed, 
      // or if appwrite queries allow it. Appwrite doesn't allow querying on attributes without indexes.
      // We'll just fetch all profiles for simplicity. In a real prod environment we'd use an index on role.
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.profiles,
      );
      // Fallback: filter locally to just show patients if possible, but actually we can just show all 
      // or filter if we know the role. Since we don't have an index guaranteed, let's just use all profiles
      // and maybe filter if `role` exists in the document.
      return res.documents.filter(doc => !doc.role || doc.role === "patient");
    },
    enabled: open, // only fetch when dialog is open
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: recordToEdit?.profileId || "",
      diagnosis: recordToEdit?.diagnosis || "",
      treatmentPlan: recordToEdit?.treatmentPlan || "",
      notes: recordToEdit?.notes || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (recordToEdit) {
        // Update existing
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.records,
          recordToEdit.$id,
          {
            diagnosis: data.diagnosis,
            treatmentPlan: data.treatmentPlan,
            notes: data.notes,
            // don't change profileId or doctorId on edit usually
          }
        );
        toast.success("Medical record updated successfully");
      } else {
        // Create new
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.records,
          ID.unique(),
          {
            profileId: data.profileId,
            doctorId: user?.$id, // The current logged-in user is the doctor
            diagnosis: data.diagnosis,
            treatmentPlan: data.treatmentPlan,
            notes: data.notes,
            visitDate: new Date().toISOString(),
          }
        );
        toast.success("Medical record created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to save medical record");
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
          <DialogTitle>{recordToEdit ? "Edit Medical Record" : "Add Medical Record"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!recordToEdit} // Can't change patient once record is created
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
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acute Bronchitis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatmentPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Plan</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Prescribed antibiotics, rest for 3 days..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
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
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any observations or secondary notes..." 
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
                {isSubmitting ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
