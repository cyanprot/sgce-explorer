import { useState, useEffect, useRef } from "react";
import { COLORS } from "@/constants/protein-data";
import { NARRATION_SCRIPTS } from "@/constants/codon-data";

interface AudioNarrationProps {
  stepIndex: number;
}

export function AudioNarration({ stepIndex }: AudioNarrationProps) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const isSupported =
    typeof globalThis.speechSynthesis !== "undefined" &&
    typeof globalThis.SpeechSynthesisUtterance !== "undefined";

  useEffect(() => {
    if (!enabledRef.current || !isSupported) return;

    speechSynthesis.cancel();
    const script = NARRATION_SCRIPTS[stepIndex];
    if (script) {
      const utterance = new SpeechSynthesisUtterance(script.text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, [stepIndex, isSupported]);

  const toggle = () => {
    if (enabled) {
      speechSynthesis.cancel();
      setEnabled(false);
    } else {
      setEnabled(true);
      // Speak current step immediately
      const script = NARRATION_SCRIPTS[stepIndex];
      if (script && isSupported) {
        const utterance = new SpeechSynthesisUtterance(script.text);
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable audio narration" : "Enable audio narration"}
      className="px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer"
      style={{
        background: enabled ? COLORS.accent : COLORS.panel,
        color: enabled ? COLORS.text : COLORS.text,
        borderColor: enabled ? COLORS.accent : COLORS.panelBorder,
      }}
    >
      {enabled ? "Narration On" : "Narration Off"}
    </button>
  );
}
