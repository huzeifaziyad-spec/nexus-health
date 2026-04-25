import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Activity, Calendar } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { Query } from "appwrite";

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

const AdminAnalytics = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const allAppointmentsRes = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.appointments,
        queries: [Query.limit(500), Query.orderDesc("appointmentDate")]
      });

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const last6Months = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        last6Months.push({ 
          month: months[monthIndex], 
          patients: 0, 
          completed: 0,
          cancelled: 0,
          index: monthIndex 
        });
      }

      allAppointmentsRes.documents.forEach((apt: any) => {
        if (!apt.appointmentDate) return;
        const date = new Date(apt.appointmentDate);
        const monthName = months[date.getMonth()];
        const monthData = last6Months.find(m => m.month === monthName);
        if (monthData) {
          monthData.patients++;
          if (apt.status === "completed") monthData.completed++;
          if (apt.status === "cancelled") monthData.cancelled++;
        }
      });

      return {
        chartData: last6Months,
        totalAppointments: allAppointmentsRes.total
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground">Deep dive into hospital performance metrics</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Patient Growth</CardTitle>
                <CardDescription>Monthly patient inflow trends</CardDescription>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData?.chartData || []}>
                  <defs>
                    <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="patients" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Appointment Status</CardTitle>
                <CardDescription>Success vs. Cancellation rates</CardDescription>
              </div>
              <div className="p-2 bg-accent/10 rounded-full">
                <Activity className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Departmental Distribution</CardTitle>
            <CardDescription>Patient volume by specialty</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="h-[250px] w-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={70}
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
            </div>
            <div className="grid grid-cols-1 gap-3 min-w-[200px]">
              {mockPieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-muted-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Peak Hours</CardTitle>
            <CardDescription>Average appointment load by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-end justify-between px-4 pb-2">
              {[30, 45, 60, 80, 95, 70, 40, 20].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div 
                    className="w-4/5 bg-primary/20 rounded-t-sm relative group cursor-pointer"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-sm" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{8 + i}:00</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
