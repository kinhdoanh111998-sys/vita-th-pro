import { createFileRoute } from "@tanstack/react-router";
import { QrCode } from "lucide-react";

export const Route = createFileRoute("/app/scan")({
  component: ScanPage,
});

function ScanPage() {
  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-black">
      {/* Dark camera backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />

      {/* Header title */}
      <div className="relative z-10 flex flex-col items-center pt-12 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white">Quét mã QR</h1>
      </div>

      {/* Scanner viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="relative aspect-square w-full max-w-[300px]">
          {/* Corner brackets */}
          <span className="absolute top-0 left-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-yellow-400" />
          <span className="absolute top-0 right-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-yellow-400" />
          <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-yellow-400" />
          <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-yellow-400" />

          {/* Subtle inner glow to mark the scan area */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(250,204,21,0.15)]" />

          {/* Decorative QR icon in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <QrCode className="h-20 w-20 text-white/15" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Guide text */}
      <div className="absolute bottom-24 left-0 right-0 z-10 px-8 text-center">
        <p className="font-body text-sm leading-relaxed text-gray-300">
          Di chuyển camera đến vùng chứa mã QR để quét
        </p>
      </div>
    </div>
  );
}
