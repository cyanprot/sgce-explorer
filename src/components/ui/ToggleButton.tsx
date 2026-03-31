import { COLORS } from "@/constants/protein-data";

interface Props {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}

export function ToggleButton({ active, onClick, label, color }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-md text-xs font-semibold
                 transition-all duration-150 cursor-pointer border"
      style={{
        background: active ? color + "22" : "transparent",
        color: active ? color : COLORS.textDim,
        borderColor: active ? color : COLORS.panelBorder,
      }}
    >
      {label}
    </button>
  );
}
