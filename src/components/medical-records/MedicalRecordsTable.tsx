import { useState } from "react";
import { format } from "date-fns";
import { Search, Eye, Edit2, FileText } from "lucide-react";
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
import { MedicalRecordDetailsDialog } from "./MedicalRecordDetailsDialog";
import { MedicalRecordFormDialog } from "./MedicalRecordFormDialog";
import { useAuth } from "@/contexts/AuthContext";

interface MedicalRecordsTableProps {
  records: any[];
}

export function MedicalRecordsTable({ records }: MedicalRecordsTableProps) {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
  
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const filteredRecords = records.filter((rec) => {
    const searchString = searchTerm.toLowerCase();
    const patientName = rec.patient?.full_name?.toLowerCase() || "";
    const doctorName = rec.doctor?.full_name?.toLowerCase() || "";
    const diagnosis = rec.diagnosis?.toLowerCase() || "";
    
    return patientName.includes(searchString) || 
           doctorName.includes(searchString) || 
           diagnosis.includes(searchString);
  });

  const handleViewDetails = (record: any) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const handleEdit = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToEdit(record);
    setEditOpen(true);
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No medical records found</p>
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
            placeholder="Search by patient, doctor, or diagnosis..."
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
              <TableHead>Diagnosis</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow 
                key={record.$id} 
                className="cursor-pointer"
                onClick={() => handleViewDetails(record)}
              >
                <TableCell className="whitespace-nowrap">
                  {format(new Date(record.visitDate || new Date()), "MMM dd, yyyy")}
                </TableCell>
                {role !== "patient" && (
                  <TableCell className="font-medium">
                    {record.patient?.full_name || "Unknown"}
                  </TableCell>
                )}
                <TableCell>{record.diagnosis || "General Checkup"}</TableCell>
                <TableCell>Dr. {record.doctor?.full_name || "Unknown"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(record);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(role === "admin" || role === "doctor") && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => handleEdit(record, e)}
                        title="Edit Record"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={role !== "patient" ? 5 : 4} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MedicalRecordDetailsDialog 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        record={selectedRecord} 
      />
      
      {(role === "admin" || role === "doctor") && (
        <MedicalRecordFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          recordToEdit={recordToEdit}
        />
      )}
    </div>
  );
}
