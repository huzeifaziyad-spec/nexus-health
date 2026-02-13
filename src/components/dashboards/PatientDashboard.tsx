import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Pill, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const PatientDashboard = () => {
  const { profile } = useAuth();

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*, doctor:profiles!appointments_doctor_id_fkey(full_name, specialization)")
        .eq("patient_id", profile.id)
        .order("appointment_date", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("prescriptions")
        .select("*, doctor:profiles!prescriptions_doctor_id_fkey(full_name)")
        .eq("patient_id", profile.id)
        .order("prescribed_date", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: records = [] } = useQuery({
    queryKey: ["patient-records", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", profile.id)
        .order("record_date", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
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
          { label: "Next Appointment", value: appointments[0] ? format(new Date(appointments[0].appointment_date), "MMM d") : "None", icon: Clock, color: "text-info" },
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
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Dr. {apt.doctor?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{apt.doctor?.specialization || "General"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.appointment_date), "PPP 'at' p")}
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
                <div key={rx.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{rx.medication}</p>
                    <p className="text-xs text-muted-foreground">{rx.dosage} · {rx.frequency}</p>
                    <p className="text-xs text-muted-foreground">By Dr. {rx.doctor?.full_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(rx.prescribed_date), "MMM d, yyyy")}
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
              <div key={rec.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{rec.diagnosis || "General Checkup"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(rec.record_date), "MMM d, yyyy")}</p>
                </div>
                {rec.treatment && <p className="text-xs text-muted-foreground">{rec.treatment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;
