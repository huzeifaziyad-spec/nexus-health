import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { format } from "date-fns";
import { Pill } from "lucide-react";

const Prescriptions = () => {
  const { profile, role, user } = useAuth();

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["prescriptions", user?.$id, role],
    queryFn: async () => {
      if (!user?.$id) return [];

      let queries = [Query.orderDesc("$createdAt")];
      if (role === "patient") queries.push(Query.equal("patientId", user.$id));
      // In user's schema, prescribingDoctor seems to be a field in prescriptions

      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.prescriptions,
        queries: queries
      });

      // Fetch patient names for display if needed
      const prescriptionsWithProfiles = await Promise.all(res.documents.map(async (rx) => {
        try {
          const prof = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: rx.patientId
          });
          return { ...rx, patient: { full_name: `${prof.firstName} ${prof.lastName}` } };
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
      <div>
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground">
          {role === "patient" ? "Your medications" : "Issued prescriptions"}
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No prescriptions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prescriptions.map((rx: any) => (
            <Card key={rx.$id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    {rx.medicationName}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rx.$createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Dosage:</span>
                  <span>{rx.dosage}</span>
                </div>
                {rx.frequency && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span>{rx.frequency}</span>
                  </div>
                )}
                {rx.expirationDate && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{format(new Date(rx.expirationDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {rx.notes && <p className="text-xs text-muted-foreground mt-2">{rx.notes}</p>}
                <div className="pt-2 flex justify-between text-xs text-muted-foreground">
                  {role !== "patient" && rx.patient && <span>Patient: {rx.patient.full_name}</span>}
                  <span>Dr. {rx.prescribingDoctor || "Doctor"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
