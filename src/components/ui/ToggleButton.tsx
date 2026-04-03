import { COLORS } from "@/constants/protein-data";

interface Props {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
  disabled?: boolean;
  title?: string;
}

export function ToggleButton({ active, onClick, label, color, disabled, title }: Props) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold
                 transition-all duration-150 border ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
