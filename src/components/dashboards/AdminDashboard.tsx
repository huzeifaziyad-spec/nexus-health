import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, Receipt, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";
import { startOfDay, endOfDay, format } from "date-fns";

const mockBarData = [
  { month: "Jan", patients: 45 },
  { month: "Feb", patients: 62 },
  { month: "Mar", patients: 58 },
  { month: "Apr", patients: 71 },
  { month: "May", patients: 80 },
  { month: "Jun", patients: 95 },
];

const mockPieData = [
  { name: "Cardiology", value: 30 },
  { name: "Neurology", value: 20 },
  { name: "Orthopedics", value: 25 },
  { name: "Pediatrics", value: 15 },
  { name: "General", value: 10 },
];

const COLORS = [
  "hsl(210, 85%, 45%)",
  "hsl(170, 65%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 55%)",
];

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patientsRes, doctorsRes, allAppointmentsRes] = await Promise.all([
        databases.listDocuments({
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.profiles,
          queries: [Query.equal("role", "patient"), Query.limit(1)]
        }),
        databases.listDocuments({
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.profiles,
          queries: [Query.equal("role", "doctor"), Query.limit(1)]
        }),
        databases.listDocuments({
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.appointments,
          queries: [Query.limit(100), Query.orderDesc("appointmentDate")]
        })
      ]);

      // Group appointments by month for the chart
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push({ month: months[monthIndex], patients: 0, index: monthIndex });
      }

      allAppointmentsRes.documents.forEach((apt: any) => {
        if (!apt.appointmentDate) return;
        const date = new Date(apt.appointmentDate);
        const monthName = months[date.getMonth()];
        const monthData = last6Months.find(m => m.month === monthName);
        if (monthData) monthData.patients++;
      });

      const appointmentsToday = allAppointmentsRes.documents.filter((apt: any) => 
        apt.appointmentDate && format(new Date(apt.appointmentDate), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
      ).length;

      return {
        totalPatients: patientsRes.total,
        totalDoctors: doctorsRes.total,
        appointmentsToday: appointmentsToday,
        chartData: last6Months
      };
    }
  });

  const chartData = stats?.chartData || mockBarData;

  const statCards = [
    { label: "Total Patients", value: isLoading ? "..." : stats?.totalPatients.toString(), icon: Users, color: "text-primary", change: "+0%" },
    { label: "Total Doctors", value: isLoading ? "..." : stats?.totalDoctors.toString(), icon: Activity, color: "text-success", change: "+0%" },
    { label: "Appointments Today", value: isLoading ? "..." : stats?.appointmentsToday.toString(), icon: Calendar, color: "text-accent", change: "+0%" },
    { label: "Revenue (MTD)", value: "$0.00", icon: Receipt, color: "text-warning", change: "+0%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Hospital overview & analytics</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Patient Inflow</CardTitle>
            <CardDescription>Monthly patient admissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.1)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="patients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>Patient distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={60}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={5}
                >
                  {mockPieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockPieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
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
