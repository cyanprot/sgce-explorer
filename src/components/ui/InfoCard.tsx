import { COLORS } from "@/constants/protein-data";

interface Props {
  title: string;
  items: string[];
}

export function InfoCard({ title, items }: Props) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ background: COLORS.panel, borderColor: COLORS.panelBorder }}
    >
      <h4 className="text-sm font-bold mb-2.5" style={{ color: COLORS.accent }}>
        {title}
      </h4>
      {items.map((item, i) => (
        <div
          key={i}
          className="text-xs leading-relaxed mb-1.5 pl-3 relative"
          style={{ color: COLORS.textDim }}
        >
          <span className="absolute left-0" style={{ color: COLORS.accent }}>·</span>
          {item}
        </div>
      ))}
    </div>
  );
}
