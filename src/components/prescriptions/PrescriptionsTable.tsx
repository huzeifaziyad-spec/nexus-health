import { useState } from "react";
import { format, isPast } from "date-fns";
import { Search, Eye, Edit2, Pill } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrescriptionDetailsDialog } from "./PrescriptionDetailsDialog";
import { PrescriptionFormDialog } from "./PrescriptionFormDialog";
import { useAuth } from "@/contexts/AuthContext";

interface PrescriptionsTableProps {
  prescriptions: any[];
}

export function PrescriptionsTable({ prescriptions }: PrescriptionsTableProps) {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
  
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const searchString = searchTerm.toLowerCase();
    const patientName = rx.patient?.full_name?.toLowerCase() || "";
    const doctorName = rx.prescribingDoctor?.toLowerCase() || "";
    const medicationName = rx.medicationName?.toLowerCase() || "";
    
    return patientName.includes(searchString) || 
           doctorName.includes(searchString) || 
           medicationName.includes(searchString);
  });

  const handleViewDetails = (prescription: any) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  const handleEdit = (prescription: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToEdit(prescription);
    setEditOpen(true);
  };

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Pill className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No prescriptions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medication, patient, or doctor..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {role !== "patient" && <TableHead>Patient</TableHead>}
              <TableHead>Medication</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrescriptions.map((rx) => {
              const isExpired = rx.expirationDate && isPast(new Date(rx.expirationDate));

              return (
                <TableRow 
                  key={rx.$id} 
                  className="cursor-pointer"
                  onClick={() => handleViewDetails(rx)}
                >
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(rx.$createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  {role !== "patient" && (
                    <TableCell className="font-medium">
                      {rx.patient?.full_name || "Unknown"}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      {rx.medicationName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none">Expired</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>Dr. {rx.prescribingDoctor || "Unknown"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(rx);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(role === "admin" || role === "doctor") && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleEdit(rx, e)}
                          title="Edit Prescription"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredPrescriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={role !== "patient" ? 6 : 5} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PrescriptionDetailsDialog 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        prescription={selectedPrescription} 
      />
      
      {(role === "admin" || role === "doctor") && (
        <PrescriptionFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          recordToEdit={recordToEdit}
        />
      )}
    </div>
  );
}
