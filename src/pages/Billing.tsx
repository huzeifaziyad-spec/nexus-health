import { useAuth } from "@/contexts/AuthContext";
import AdminBilling from "@/components/dashboards/AdminBilling";
import { Navigate } from "react-router-dom";

const Billing = () => {
  const { role } = useAuth();

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminBilling />;
};

export default Billing;
