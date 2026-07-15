import { create } from "zustand";
import type { Variant, DerivedConsequence } from "@/types";
import { MUTATION } from "@/constants/protein-data";
import { deriveConsequence } from "@/constants/codon-data";

/**
 * Selected-variant store. The whole explorer reads the active variant (and its
 * derived consequence) from here instead of the module-level MUTATION constant,
 * so a variant switcher can drive every tab. Defaults to the patient's c.108dup.
 */
interface VariantState {
  selected: Variant;
  consequence: DerivedConsequence;
  setSelected: (v: Variant) => void;
  resetToPatient: () => void;
}

export const useVariantStore = create<VariantState>((set) => ({
  selected: MUTATION,
  consequence: deriveConsequence(MUTATION),
  setSelected: (v) => set({ selected: v, consequence: deriveConsequence(v) }),
  resetToPatient: () =>
    set({ selected: MUTATION, consequence: deriveConsequence(MUTATION) }),
}));
