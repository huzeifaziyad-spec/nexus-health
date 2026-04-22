import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { databases, APPWRITE_CONFIG } from "@/integrations/appwrite/client";
import { ID, Query } from "appwrite";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Appointments = () => {
  const { role, profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", user?.$id, role],
    queryFn: async () => {
      if (!user?.$id) return [];
      
      let queries = [Query.orderAsc("appointmentDate")];
      if (role === "patient") queries.push(Query.equal("profileId", user.$id));
      // Note: doctor_id is missing in user's current schema, using profileId for now

      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.appointments,
        queries: queries
      });

      // Manual join: Fetch profile names for display
      const appointmentsWithProfiles = await Promise.all(res.documents.map(async (apt) => {
        try {
          const prof = await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.profiles,
            documentId: apt.profileId
          });
          return { ...apt, patient: { full_name: `${prof.firstName} ${prof.lastName}` } };
        } catch {
          return apt;
        }
      }));

      return appointmentsWithProfiles;
    },
    enabled: !!user?.$id,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: async () => {
      // Fetching all profiles and filtering for doctors (in a real app, we'd use roles)
      const res = await databases.listDocuments({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.profiles
      });
      return res.documents.map(doc => ({
        id: doc.$id,
        full_name: `${doc.firstName} ${doc.lastName}`,
        specialization: doc.bio || "" // Using bio as specialization if missing
      }));
    },
    enabled: role === "patient" || role === "admin",
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!date || !user?.$id) throw new Error("Missing data");
      const appointmentDate = new Date(date);
      appointmentDate.setHours(parseInt(hour), parseInt(minute));

      const patientId = role === "patient" ? user.$id : selectedPatient;

      if (!patientId) throw new Error("Please select a patient");

      await databases.createDocument({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.appointments,
        documentId: ID.unique(),
        data: {
          profileId: patientId,
          appointmentDate: appointmentDate.toISOString(),
          notes,
          status: "scheduled",
          appointmentType: "general", // Default
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked!");
      setDialogOpen(false);
      setDate(undefined);
      setNotes("");
      setSelectedDoctor("");
      setSelectedPatient("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusColor: Record<string, string> = {
    scheduled: "bg-info/10 text-info border-info/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage your appointments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Book Appointment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {role === "patient" && (
                <div className="space-y-2">
                  <Label>Select Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger><SelectValue placeholder="Choose a doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc: any) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          Dr. {doc.full_name} {doc.specialization ? `(${doc.specialization})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto"
                      disabled={(d) => d < new Date()} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hour</Label>
                  <Select value={hour} onValueChange={setHour}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 8).map(h => (
                        <SelectItem key={h} value={h.toString().padStart(2, "0")}>{h.toString().padStart(2, "0")}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minutes</Label>
                  <Select value={minute} onValueChange={setMinute}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map(m => (
                        <SelectItem key={m} value={m}>:{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for visit..." />
              </div>
              <Button className="w-full" onClick={() => createAppointment.mutate()} disabled={createAppointment.isPending}>
                {createAppointment.isPending ? "Booking..." : "Book Appointment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">No appointments found</p>
            ) : (
              appointments.map((apt: any) => (
                <div key={apt.$id} className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {role === "patient" ? `Dr. ${apt.doctor?.full_name || "Doctor"}` : apt.patient?.full_name}
                    </p>
                    {role === "patient" && apt.doctor?.specialization && (
                      <p className="text-xs text-muted-foreground">{apt.doctor.specialization}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.appointmentDate), "PPP 'at' p")}
                    </p>
                    {apt.notes && <p className="text-xs text-muted-foreground">{apt.notes}</p>}
                  </div>
                  <Badge variant="outline" className={statusColor[apt.status] || ""}>
                    {apt.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;
