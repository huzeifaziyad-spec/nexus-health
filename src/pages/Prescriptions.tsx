import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Pill } from "lucide-react";

const Prescriptions = () => {
  const { profile, role } = useAuth();

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["prescriptions", profile?.id, role],
    queryFn: async () => {
      if (!profile?.id) return [];
      let query = supabase
        .from("prescriptions")
        .select("*, patient:profiles!prescriptions_patient_id_fkey(full_name), doctor:profiles!prescriptions_doctor_id_fkey(full_name)")
        .order("prescribed_date", { ascending: false });

      if (role === "patient") query = query.eq("patient_id", profile.id);
      else if (role === "doctor") query = query.eq("doctor_id", profile.id);

      const { data } = await query;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground">
          {role === "patient" ? "Your medications" : "Issued prescriptions"}
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No prescriptions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prescriptions.map((rx: any) => (
            <Card key={rx.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    {rx.medication}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(rx.prescribed_date), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Dosage:</span>
                  <span>{rx.dosage}</span>
                </div>
                {rx.frequency && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span>{rx.frequency}</span>
                  </div>
                )}
                {rx.duration && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{rx.duration}</span>
                  </div>
                )}
                {rx.notes && <p className="text-xs text-muted-foreground mt-2">{rx.notes}</p>}
                <div className="pt-2 flex justify-between text-xs text-muted-foreground">
                  {role !== "patient" && rx.patient && <span>Patient: {rx.patient.full_name}</span>}
                  {role !== "doctor" && rx.doctor && <span>Dr. {rx.doctor.full_name}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
