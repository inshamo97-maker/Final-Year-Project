import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ResourceFormDialog } from "@/components/ui/resource-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CsvUploadButton } from "@/components/ui/csv-upload-button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import * as api from "@/services/api";
import { getCurrentUser } from "@/services/api";
import { toast } from "sonner";

const fields = [
  { name: "name",       label: "Name",       type: "text",     required: true },
  { name: "email",      label: "Email",      type: "email",    required: true },
  { name: "password",   label: "Password",   type: "password", required: false, placeholder: "Leave blank to keep" },
  { name: "phone",      label: "Phone",      type: "text" },
  { name: "department", label: "Department", type: "text" },
];

export default function AdminInvigilators() {
  const user = getCurrentUser() || { name: "Admin", id: "admin", role: "admin" };
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const reload = async () => {
    setLoading(true);
    try { setRows(await api.getInvigilators()); }
    catch (e) { toast.error(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const onSubmit = async (payload) => {
    try {
      if (editing) {
        await api.updateInvigilator(editing.id, payload);
        toast.success("Invigilator updated");
      } else {
        await api.createInvigilator(payload);
        toast.success("Invigilator added");
      }
      reload();
    } catch (e) { toast.error(e.message || "Save failed"); }
  };

  const onDelete = async (row) => {
    try { await api.deleteInvigilator(row.id); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(e.message || "Delete failed"); }
  };

  return (
    <DashboardLayout userRole={user.role} userName={user.name} userId={user.id} pageTitle="Invigilators">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-wrap gap-2 justify-end">
          <CsvUploadButton onUpload={api.uploadInvigilatorsCsv} />
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Invigilator
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <DataTable
            emptyMessage="No invigilators yet"
            columns={[
              { header: "Name",       accessor: "name" },
              { header: "Email",      accessor: "email" },
              { header: "Phone",      accessor: "phone" },
              { header: "Department", accessor: "department" },
              { header: "",
                className: "w-40",
                accessor: (r) => (
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(r); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDel(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </div>

      <ResourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Edit Invigilator" : "Add Invigilator"}
        fields={fields}
        initialValues={editing || {}}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Delete invigilator?"
        description={`This will permanently remove ${confirmDel?.name}.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => onDelete(confirmDel)}
      />
    </DashboardLayout>
  );
}
