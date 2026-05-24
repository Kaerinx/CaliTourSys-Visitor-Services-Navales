interface WireframeAnnotationProps {
  text: string;
  label?: string;
  position?: "inline" | "corner";
}

export function WireframeAnnotation({ text, label = "ANNOTATION", position = "inline" }: WireframeAnnotationProps) {
  if (position === "corner") {
    return (
      <div className="absolute top-2 right-2 z-20 max-w-[220px] bg-[#FAFAFA] border border-dashed border-[#757575] p-2 shadow-sm">
        <div className="font-mono text-[10px] font-bold text-[#757575] uppercase mb-1 tracking-wide">
          ✎ {label}
        </div>
        <div className="font-mono text-[11px] text-[#212121] italic leading-relaxed">{text}</div>
      </div>
    );
  }
  return (
    <div className="bg-[#FAFAFA] border border-dashed border-[#757575] p-3 mt-2 w-full">
      <div className="font-mono text-[10px] font-bold text-[#757575] uppercase mb-1 tracking-wide">
        ✎ {label}
      </div>
      <div className="font-mono text-[11px] text-[#212121] italic leading-relaxed">{text}</div>
    </div>
  );
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <div className="inline-block bg-[#212121] text-white font-mono text-[10px] uppercase tracking-widest px-2 py-1 mb-2">
      {label}
    </div>
  );
}
