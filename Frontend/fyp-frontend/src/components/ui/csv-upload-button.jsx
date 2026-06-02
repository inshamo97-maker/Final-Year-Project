import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function CsvUploadButton({ onUpload, label = "Upload CSV" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
      toast.success("CSV uploaded.");
    } catch (err) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload className="mr-2 h-4 w-4" />
        {busy ? "Uploading..." : label}
      </Button>
    </>
  );
}
