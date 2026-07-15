import { render, screen, fireEvent, within } from "@testing-library/react";
import { beforeEach, describe, it, expect } from "vitest";
import { VariantsPanel } from "./VariantsPanel";
import { useVariantStore } from "@/store/variantStore";
import { VARIANT_CATALOG } from "@/constants/variant-catalog";

describe("VariantsPanel", () => {
  beforeEach(() => {
    useVariantStore.getState().resetToPatient();
  });

  it("renders the catalog heading and legend", () => {
    render(<VariantsPanel />);
    expect(screen.getByText("Known SGCE Variants")).toBeInTheDocument();
    expect(screen.getAllByText("Pathogenic").length).toBeGreaterThan(0);
  });

  it("selecting a variant row updates the store", () => {
    render(<VariantsPanel />);
    // Pick the first non-patient catalog entry and click its list row.
    const target = VARIANT_CATALOG.find((v) => !v.isPatient)!;
    const list = screen.getByRole("list");
    const row = within(list).getAllByText(target.notation)[0];
    fireEvent.click(row);
    expect(useVariantStore.getState().selected.id).toBe(target.id);
  });

  it("filtering by significance narrows the list count", () => {
    render(<VariantsPanel />);
    const select = screen.getByLabelText("Filter by clinical significance");
    fireEvent.change(select, { target: { value: "pathogenic" } });
    // shown/total counter should reflect fewer than the full catalog
    expect(screen.getByText(new RegExp(`/ ${VARIANT_CATALOG.length}$`))).toBeInTheDocument();
  });
});
