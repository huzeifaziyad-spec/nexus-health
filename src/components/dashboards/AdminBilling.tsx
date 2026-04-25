import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, TrendingUp, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from "recharts";

const mockRevenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 34000 },
  { month: "Mar", revenue: 48000, expenses: 31000 },
  { month: "Apr", revenue: 61000, expenses: 38000 },
  { month: "May", revenue: 58000, expenses: 35000 },
  { month: "Jun", revenue: 72000, expenses: 42000 },
];

const AdminBilling = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Financials</h1>
        <p className="text-muted-foreground">Monitor revenue, expenses, and pending payments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-success flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +12.5%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <h3 className="text-2xl font-bold">$72,400.00</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <span className="text-xs text-destructive flex items-center bg-destructive/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +4.2%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <h3 className="text-2xl font-bold">$12,850.00</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <span className="text-xs text-success flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +8.1%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful Transactions</p>
              <h3 className="text-2xl font-bold">1,245</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <span className="text-xs text-success flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
                -2.4%
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operating Expenses</p>
              <h3 className="text-2xl font-bold">$42,100.00</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
            <CardDescription>Financial performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}>
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
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Latest billing activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "INV-001", patient: "John Doe", amount: "$150.00", status: "Paid", type: "Consultation" },
                { id: "INV-002", patient: "Jane Smith", amount: "$2,400.00", status: "Pending", type: "Surgery" },
                { id: "INV-003", patient: "Robert Brown", amount: "$85.00", status: "Paid", type: "Lab Test" },
                { id: "INV-004", patient: "Mary Wilson", amount: "$120.00", status: "Failed", type: "Pharmacy" },
                { id: "INV-005", patient: "James Miller", amount: "$300.00", status: "Paid", type: "Imaging" },
              ].map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{tx.patient}</span>
                    <span className="text-[10px] text-muted-foreground">{tx.type} • {tx.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold block">{tx.amount}</span>
                    <span className={`text-[10px] font-medium ${
                      tx.status === "Paid" ? "text-success" : 
                      tx.status === "Pending" ? "text-warning" : "text-destructive"
                    }`}>{tx.status}</span>
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

export default AdminBilling;
