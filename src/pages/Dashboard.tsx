import { useAuth } from "@/contexts/AuthContext";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

const Dashboard = () => {
  const { role } = useAuth();

  if (role === "admin") return <AdminDashboard />;
  if (role === "doctor") return <DoctorDashboard />;
  return <PatientDashboard />;
};

export default Dashboard;
