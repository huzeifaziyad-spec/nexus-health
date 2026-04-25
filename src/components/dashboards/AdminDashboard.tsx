import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Receipt, Activity, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { startOfDay, endOfDay, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patientsRes, doctorsRes, allAppointmentsRes] = await Promise.all([
        databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.profiles,
          [Query.equal("role", "patient"), Query.limit(1)]
        ),
        databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.profiles,
          [Query.equal("role", "doctor"), Query.limit(1)]
        ),
        databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.appointments,
          [Query.limit(100), Query.orderDesc("appointmentDate")]
        )
      ]);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const appointmentsToday = allAppointmentsRes.documents.filter((apt: any) => 
        apt.appointmentDate && format(new Date(apt.appointmentDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
      ).length;

      return {
        totalPatients: patientsRes.total,
        totalDoctors: doctorsRes.total,
        appointmentsToday: appointmentsToday,
        recentAppointments: allAppointmentsRes.documents
      };
    }
  });


  const statCards = [
    { label: "Total Patients", value: isLoading ? "..." : stats?.totalPatients.toString(), icon: Users, color: "text-primary", change: "+0%" },
    { label: "Total Doctors", value: isLoading ? "..." : stats?.totalDoctors.toString(), icon: Activity, color: "text-success", change: "+0%" },
    { label: "Appointments Today", value: isLoading ? "..." : stats?.appointmentsToday.toString(), icon: Calendar, color: "text-accent", change: "+0%" },
    { label: "Revenue (MTD)", value: "$0.00", icon: Receipt, color: "text-warning", change: "+0%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Hospital overview & summary</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="stat-gradient border-border/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-card p-2.5 shadow-sm ${stat.color} border border-border/50`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <span className="text-xs text-success flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Appointments</CardTitle>
            <CardDescription>Latest patient visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-lg" />)}
                </div>
              ) : (
                stats?.recentAppointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.$id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {apt.patientName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{apt.patientName || "Anonymous"}</p>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(apt.appointmentDate), "MMM dd, hh:mm a")}</p>
                      </div>
                    </div>
                    <Badge variant={apt.status === "completed" ? "success" : "secondary"} className="text-[10px] h-5 px-1.5">
                      {apt.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Staff Availability</CardTitle>
            <CardDescription>Currently active doctors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Dr. Sarah Chen", specialty: "Cardiology", status: "On Duty" },
                { name: "Dr. Michael Ross", specialty: "Neurology", status: "In Surgery" },
                { name: "Dr. Elena Gilbert", specialty: "Pediatrics", status: "On Break" },
              ].map((staff, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{staff.name}</p>
                      <p className="text-[10px] text-muted-foreground">{staff.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      staff.status === "On Duty" ? "bg-success" : 
                      staff.status === "In Surgery" ? "bg-destructive" : "bg-warning"
                    }`} />
                    <span className="text-[10px] font-medium">{staff.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
