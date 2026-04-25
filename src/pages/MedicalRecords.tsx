import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { format } from "date-fns";
import { FileText } from "lucide-react";

const MedicalRecords = () => {
  const { profile, role, user } = useAuth();

  const { data: records = [] } = useQuery({
    queryKey: ["medical-records", user?.$id, role],
    queryFn: async () => {
      if (!user?.$id) return [];

      let queries = [Query.orderDesc("visitDate")];
      if (role === "patient") queries.push(Query.equal("profileId", user.$id));

      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.records,
        queries: queries
      });

      // Fetch patient/doctor names if needed
      const recordsWithProfiles = await Promise.all(res.documents.map(async (rec) => {
        try {
          const prof = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: rec.profileId
          });
          return { ...rec, patient: { full_name: `${prof.firstName} ${prof.lastName}` } };
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
      <div>
        <h1 className="text-2xl font-bold">Medical Records</h1>
        <p className="text-muted-foreground">
          {role === "patient" ? "Your health records" : "Patient health records"}
        </p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No medical records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((rec: any) => (
            <Card key={rec.$id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rec.diagnosis || "General Checkup"}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rec.visitDate || new Date()), "PPP")}
                  </span>
                </div>
                {role !== "patient" && rec.patient && (
                  <CardDescription>Patient: {rec.patient.full_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {rec.treatmentPlan && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Treatment</p>
                    <p className="text-sm">{rec.treatmentPlan}</p>
                  </div>
                )}
                {rec.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{rec.notes}</p>
                  </div>
                )}
                {rec.doctor && (
                  <p className="text-xs text-muted-foreground">Attending: Dr. {rec.doctor.full_name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
