export function WireframeStates() {
  return (
    <div className="border border-dashed border-[#BDBDBD] p-4 mt-4 bg-[#F5F5F5]">
      <div className="font-mono text-[10px] text-[#757575] uppercase tracking-widest mb-3">
        COMPONENT STATES
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Default */}
        <div className="flex flex-col items-center gap-1">
          <button className="px-4 py-2 border-2 border-[#212121] bg-white text-[#212121] font-mono text-xs">
            Default
          </button>
          <span className="font-mono text-[9px] text-[#757575]">DEFAULT</span>
        </div>
        {/* Hover */}
        <div className="flex flex-col items-center gap-1">
          <button className="px-4 py-2 border-2 border-dashed border-[#212121] bg-[#E0E0E0] text-[#212121] font-mono text-xs">
            Hover
          </button>
          <span className="font-mono text-[9px] text-[#757575]">HOVER</span>
        </div>
        {/* Active */}
        <div className="flex flex-col items-center gap-1">
          <button className="px-4 py-2 border-2 border-[#212121] bg-[#212121] text-white font-mono text-xs">
            Active
          </button>
          <span className="font-mono text-[9px] text-[#757575]">ACTIVE</span>
        </div>
        {/* Disabled */}
        <div className="flex flex-col items-center gap-1 opacity-40">
          <button
            disabled
            className="px-4 py-2 border-2 border-[#212121] bg-white text-[#212121] font-mono text-xs cursor-not-allowed"
          >
            Disabled
          </button>
          <span className="font-mono text-[9px] text-[#757575]">DISABLED (40% opacity)</span>
        </div>
        {/* Ghost */}
        <div className="flex flex-col items-center gap-1">
          <button className="px-4 py-2 border-2 border-[#757575] bg-transparent text-[#757575] font-mono text-xs">
            Ghost
          </button>
          <span className="font-mono text-[9px] text-[#757575]">GHOST</span>
        </div>
      </div>
    </div>
  );
}
