import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Pill, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { format } from "date-fns";

const PatientDashboard = () => {
  const { profile, user } = useAuth();

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.appointments,
        queries: [
          Query.equal("profileId", user.$id),
          Query.orderAsc("appointmentDate"),
          Query.limit(5)
        ]
      });
      
      // Manual join for doctor names
      return Promise.all(res.documents.map(async (apt) => {
        try {
          const prof = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: apt.profileId
          });
          return { ...apt, doctor: { full_name: `${prof.firstName} ${prof.lastName}` } };
        } catch {
          return apt;
        }
      }));
    },
    enabled: !!user?.$id,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.prescriptions,
        queries: [
          Query.equal("patientId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(5)
        ]
      });
      return res.documents;
    },
    enabled: !!user?.$id,
  });

  const { data: records = [] } = useQuery({
    queryKey: ["patient-records", user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.records,
        queries: [
          Query.equal("profileId", user.$id),
          Query.orderDesc("visitDate"),
          Query.limit(5)
        ]
      });
      return res.documents;
    },
    enabled: !!user?.$id,
  });

  const statusColor: Record<string, string> = {
    scheduled: "bg-info/10 text-info border-info/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.full_name || "Patient"}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Upcoming Appointments", value: appointments.filter(a => a.status === "scheduled").length, icon: Calendar, color: "text-primary" },
          { label: "Active Prescriptions", value: prescriptions.length, icon: Pill, color: "text-accent" },
          { label: "Medical Records", value: records.length, icon: FileText, color: "text-warning" },
          { label: "Next Appointment", value: appointments[0] ? format(new Date(appointments[0].appointmentDate), "MMM d") : "None", icon: Clock, color: "text-info" },
        ].map((stat) => (
          <Card key={stat.label} className="stat-gradient">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-card p-2.5 shadow-sm ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled visits</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No appointments yet</p>
            ) : (
              appointments.map((apt: any) => (
                <div key={apt.$id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Dr. {apt.doctor?.full_name || "Doctor"}</p>
                    <p className="text-xs text-muted-foreground">{apt.doctor?.specialization || "General"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.appointmentDate), "PPP 'at' p")}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColor[apt.status] || ""}>
                    {apt.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Prescriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
            <CardDescription>Your medications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No prescriptions yet</p>
            ) : (
              prescriptions.map((rx: any) => (
                <div key={rx.$id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{rx.medicationName}</p>
                    <p className="text-xs text-muted-foreground">{rx.dosage} · {rx.frequency}</p>
                    <p className="text-xs text-muted-foreground">By {rx.prescribingDoctor || "Doctor"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(rx.$createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Medical History</CardTitle>
          <CardDescription>Your health records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No records yet</p>
          ) : (
            records.map((rec: any) => (
              <div key={rec.$id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{rec.diagnosis || "General Checkup"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(rec.visitDate || rec.$createdAt), "MMM d, yyyy")}</p>
                </div>
                {rec.treatmentPlan && <p className="text-xs text-muted-foreground">{rec.treatmentPlan}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
