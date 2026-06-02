import { Camera } from "lucide-react";

export default function LiveCamera() {
  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Live Camera Feed</h3>
      </div>
      <div className="rounded-md overflow-hidden border border-border bg-muted/40">
        <img
          src="http://localhost:5000/video-feed"
          alt="Live exam hall camera"
          className="w-full aspect-video object-cover"
        />
      </div>
    </div>
  );
}
