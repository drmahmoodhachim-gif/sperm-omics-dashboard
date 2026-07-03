"use client";

import { useState } from "react";
import { FileImage, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FigureExportProps {
  figureId: string;
  figureTitle: string;
  className?: string;
}

export function FigureExport({ figureId, figureTitle, className }: FigureExportProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  async function exportFigure(format: "svg" | "pdf" | "png") {
    setExporting(format);
    try {
      const container = document.getElementById(`figure-content-${figureId}`);
      if (!container) throw new Error("Figure container not found");

      const filename = figureTitle
        .replace(/[^a-z0-9]+/gi, "_")
        .slice(0, 60)
        .toLowerCase();

      if (format === "svg") {
        await exportSvg(container, `${filename}.svg`);
      } else if (format === "png") {
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(container, {
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else {
        await exportPdf(container, `${filename}.pdf`, figureTitle);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <ExportButton
        icon={FileImage}
        label="SVG"
        loading={exporting === "svg"}
        onClick={() => exportFigure("svg")}
      />
      <ExportButton
        icon={FileImage}
        label="PNG"
        loading={exporting === "png"}
        onClick={() => exportFigure("png")}
      />
      <ExportButton
        icon={FileText}
        label="PDF"
        loading={exporting === "pdf"}
        onClick={() => exportFigure("pdf")}
      />
    </div>
  );
}

function ExportButton({
  icon: Icon,
  label,
  loading,
  onClick,
}: {
  icon: typeof FileImage;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" />
      {loading ? "Exporting…" : label}
    </button>
  );
}

async function exportSvg(container: HTMLElement, filename: string) {
  const svgEl = container.querySelector("svg");
  if (svgEl) {
    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob(
      [`<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`],
      { type: "image/svg+xml;charset=utf-8" }
    );
    downloadBlob(blob, filename);
    return;
  }

  const { toSvg } = await import("html-to-image");
  const dataUrl = await toSvg(container, { backgroundColor: "#ffffff" });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

async function exportPdf(container: HTMLElement, filename: string, title: string) {
  const { jsPDF } = await import("jspdf");
  const { toPng } = await import("html-to-image");

  const dataUrl = await toPng(container, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width, img.height + 40],
  });

  pdf.setFontSize(12);
  pdf.text(title.slice(0, 100), 20, 20);
  pdf.addImage(dataUrl, "PNG", 0, 30, img.width, img.height);
  pdf.save(filename);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
