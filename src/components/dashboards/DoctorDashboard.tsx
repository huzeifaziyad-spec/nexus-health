import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ClipboardList, Pill, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const DoctorDashboard = () => {
  const { profile } = useAuth();

  const { data: appointments = [] } = useQuery({
    queryKey: ["doctor-appointments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*, patient:profiles!appointments_patient_id_fkey(full_name, email)")
        .eq("doctor_id", profile.id)
        .order("appointment_date", { ascending: true })
        .limit(10);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const todayAppointments = appointments.filter(
    (a: any) => format(new Date(a.appointment_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );

  const statusColor: Record<string, string> = {
    scheduled: "bg-info/10 text-info border-info/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, Dr. {profile?.full_name || "Doctor"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: "text-primary" },
          { label: "Total Patients", value: new Set(appointments.map((a: any) => a.patient?.full_name)).size, icon: Users, color: "text-accent" },
          { label: "Scheduled", value: appointments.filter((a: any) => a.status === "scheduled").length, icon: Clock, color: "text-warning" },
          { label: "Completed Today", value: todayAppointments.filter((a: any) => a.status === "completed").length, icon: ClipboardList, color: "text-success" },
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
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
            ) : (
              todayAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{apt.patient?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.appointment_date), "p")}
                    </p>
                    {apt.notes && <p className="text-xs text-muted-foreground">{apt.notes}</p>}
                  </div>
                  <Badge variant="outline" className={statusColor[apt.status] || ""}>
                    {apt.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* All Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
            <CardDescription>All scheduled visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.filter((a: any) => a.status === "scheduled").length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
            ) : (
              appointments
                .filter((a: any) => a.status === "scheduled")
                .map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{apt.patient?.full_name}</p>
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
      </div>
    </div>
  );
};

export default DoctorDashboard;
