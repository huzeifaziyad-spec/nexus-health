import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BarChart3, Receipt, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Hospital overview & analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Patients", value: "1,248", icon: Users, color: "text-primary", change: "+12%" },
          { label: "Appointments Today", value: "42", icon: Calendar, color: "text-accent", change: "+5%" },
          { label: "Revenue (MTD)", value: "$84.2K", icon: Receipt, color: "text-warning", change: "+8%" },
          { label: "Bed Occupancy", value: "78%", icon: Activity, color: "text-info", change: "-2%" },
        ].map((stat) => (
          <Card key={stat.label} className="stat-gradient">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-card p-2.5 shadow-sm ${stat.color}`}>
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
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Patient Inflow</CardTitle>
            <CardDescription>Monthly patient admissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                <XAxis dataKey="month" stroke="hsl(215, 15%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 50%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(210, 20%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="patients" fill="hsl(210, 85%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
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
                  dataKey="value"
                  stroke="none"
                >
                  {mockPieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(210, 20%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {mockPieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
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
