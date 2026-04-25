import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { PrescriptionsTable } from "@/components/prescriptions/PrescriptionsTable";
import { PrescriptionFormDialog } from "@/components/prescriptions/PrescriptionFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Prescriptions = () => {
  const { role, user } = useAuth();
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["prescriptions", user?.$id, role],
    queryFn: async () => {
      if (!user?.$id) return [];

      let queries = [Query.orderDesc("$createdAt")];
      if (role === "patient") queries.push(Query.equal("patientId", user.$id));

      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.prescriptions,
        queries: queries
      });

      // Fetch patient names
      const prescriptionsWithProfiles = await Promise.all(res.documents.map(async (rx) => {
        try {
          const patientProf = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: rx.patientId
          });
          
          return { 
            ...rx, 
            patient: { full_name: `${patientProf.firstName} ${patientProf.lastName}` }
          };
        } catch {
          return rx;
        }
      }));

      return prescriptionsWithProfiles;
    },
    enabled: !!user?.$id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">
            {role === "patient" ? "View and manage your active medications." : "Issue and manage patient prescriptions."}
          </p>
        </div>
        
        {(role === "admin" || role === "doctor") && (
          <Button onClick={() => setIsAddPrescriptionOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Prescription
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading prescriptions...</p>
        </div>
      ) : (
        <PrescriptionsTable prescriptions={prescriptions} />
      )}

      {(role === "admin" || role === "doctor") && (
        <PrescriptionFormDialog
          open={isAddPrescriptionOpen}
          onOpenChange={setIsAddPrescriptionOpen}
        />
      )}
    </div>
  );
};

export default Prescriptions;
