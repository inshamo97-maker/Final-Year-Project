import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Generic resource form modal.
 * fields: [{ name, label, type: 'text'|'email'|'password'|'number'|'select', options?: [{value,label}], required?: bool }]
 */
export function ResourceFormDialog({ open, onOpenChange, title, fields, initialValues = {}, onSubmit, submitLabel = "Save" }) {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const seed = {};
      for (const f of fields) seed[f.name] = initialValues[f.name] ?? "";
      setValues(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...values };
      for (const f of fields) {
        if (f.type === "number" && payload[f.name] !== "" && payload[f.name] != null) {
          payload[f.name] = Number(payload[f.name]);
        }
      }
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
              {f.type === "select" ? (
                <Select value={String(values[f.name] ?? "")} onValueChange={(v) => update(f.name, v)}>
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options || []).map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type || "text"}
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => update(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
