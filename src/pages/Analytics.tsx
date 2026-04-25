import { useAuth } from "@/contexts/AuthContext";
import AdminAnalytics from "@/components/dashboards/AdminAnalytics";
import { Navigate } from "react-router-dom";

const Analytics = () => {
  const { role } = useAuth();

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminAnalytics />;
};

export default Analytics;
