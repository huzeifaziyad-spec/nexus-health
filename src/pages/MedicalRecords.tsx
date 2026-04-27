import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { MedicalRecordsTable } from "@/components/medical-records/MedicalRecordsTable";
import { MedicalRecordFormDialog } from "@/components/medical-records/MedicalRecordFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const MedicalRecords = () => {
  const { role, user } = useAuth();
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["medical-records", user?.$id, role],
    queryFn: async () => {
      if (!user?.$id) return [];

      let queries = [Query.orderDesc("visitDate")];
      if (role === "patient") queries.push(Query.equal("profileId", user.$id));
      if (role === "doctor") queries.push(Query.equal("doctorId", user.$id));

      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.records,
        queries: queries
      });

      // Fetch patient and doctor names
      const recordsWithProfiles = await Promise.all(res.documents.map(async (rec) => {
        try {
          const patientProf = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: rec.profileId
          });
          
          let doctorName = null;
          if (rec.doctorId) {
            try {
              const docProf = await databases.getDocument({
                databaseId: APPWRITE_CONFIG.databaseId,
                collectionId: APPWRITE_CONFIG.collections.profiles,
                documentId: rec.doctorId
              });
              doctorName = `${docProf.firstName} ${docProf.lastName}`;
            } catch (e) {
              console.error("Could not fetch doctor profile", e);
            }
          }

          return { 
            ...rec, 
            patient: { full_name: `${patientProf.firstName} ${patientProf.lastName}` },
            doctor: doctorName ? { full_name: doctorName } : null
          };
        } catch {
          return rec;
        }
      }));

      return recordsWithProfiles;
    },
    enabled: !!user?.$id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">
            {role === "patient" ? "View your comprehensive health history." : "Manage and view patient medical records."}
          </p>
        </div>
        
        {(role === "admin" || role === "doctor") && (
          <Button onClick={() => setIsAddRecordOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading medical records...</p>
        </div>
      ) : (
        <MedicalRecordsTable records={records} />
      )}

      {(role === "admin" || role === "doctor") && (
        <MedicalRecordFormDialog
          open={isAddRecordOpen}
          onOpenChange={setIsAddRecordOpen}
        />
      )}
    </div>
  );
};

export default MedicalRecords;
