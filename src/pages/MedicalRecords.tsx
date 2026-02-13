import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText } from "lucide-react";

const MedicalRecords = () => {
  const { profile, role } = useAuth();

  const { data: records = [] } = useQuery({
    queryKey: ["medical-records", profile?.id, role],
    queryFn: async () => {
      if (!profile?.id) return [];
      let query = supabase
        .from("medical_records")
        .select("*, patient:profiles!medical_records_patient_id_fkey(full_name), doctor:profiles!medical_records_doctor_id_fkey(full_name)")
        .order("record_date", { ascending: false });

      if (role === "patient") query = query.eq("patient_id", profile.id);

      const { data } = await query;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medical Records</h1>
        <p className="text-muted-foreground">
          {role === "patient" ? "Your health records" : "Patient health records"}
        </p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No medical records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((rec: any) => (
            <Card key={rec.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rec.diagnosis || "General Checkup"}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rec.record_date), "PPP")}
                  </span>
                </div>
                {role !== "patient" && rec.patient && (
                  <CardDescription>Patient: {rec.patient.full_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {rec.treatment && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Treatment</p>
                    <p className="text-sm">{rec.treatment}</p>
                  </div>
                )}
                {rec.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{rec.notes}</p>
                  </div>
                )}
                {rec.doctor && (
                  <p className="text-xs text-muted-foreground">Attending: Dr. {rec.doctor.full_name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
