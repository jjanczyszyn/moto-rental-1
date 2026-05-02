import React from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, Field } from "../components/Common";
import { ExpiryField } from "../components/ExpiryField";
import { IconCheck, IconUpload, IconRefresh } from "../components/Icons";

type Phase = "idle" | "scanning" | "manual" | "done";

const uploadCard: React.CSSProperties = {
  width: "100%", border: "1.5px dashed #d8d8d8", borderRadius: 16,
  background: "#fff", padding: "32px 16px", display: "flex", flexDirection: "column",
  alignItems: "center", gap: 10, cursor: "pointer",
};

function parseTesseractText(text: string) {
  const upper = text.toUpperCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Document number: longest alphanumeric token >= 6 chars, mostly uppercase/digits
  const tokens = upper.match(/[A-Z0-9-]{6,}/g) ?? [];
  const docNumber = tokens.sort((a, b) => b.length - a.length)[0] ?? "";

  // Expiry: ISO YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  let expiryISO = "";
  const isoMatch = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const dmyMatch = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    expiryISO = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  } else if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    expiryISO = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // First/last name: line preceded by "GIVEN NAME" or "NAMES" labels; else first
  // line of mostly uppercase letters with at least 2 words.
  let firstName = "";
  let lastName = "";
  const nameLineIdx = lines.findIndex((l) => /NAME|NOMBRE|GIVEN/i.test(l));
  const candidate =
    nameLineIdx >= 0 && nameLineIdx + 1 < lines.length
      ? lines[nameLineIdx + 1]
      : lines.find((l) => /^[A-Z][A-Z\s]+\s[A-Z]/.test(l)) ?? "";
  const parts = candidate.replace(/[^A-Za-z\s'-]/g, "").trim().split(/\s+/);
  if (parts.length >= 2) {
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  // Country: known ISO names
  const countries = [
    "United States", "USA", "Canada", "Mexico", "France", "Spain", "Germany",
    "United Kingdom", "Italy", "Netherlands", "Australia", "Nicaragua",
    "Costa Rica", "Argentina", "Brazil", "Colombia", "Chile", "Peru",
  ];
  let country = "";
  for (const c of countries) {
    if (upper.includes(c.toUpperCase())) { country = c; break; }
  }

  return { firstName, lastName, docNumber, expiryISO, country };
}

export function OCRScreen({
  state, set, onBack, onNext,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = React.useState<Phase>(state.docFirstName ? "done" : "idle");
  const [progress, setProgress] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhase("scanning");
    setProgress(0);

    try {
      // Run OCR client-side. Upload to Convex storage in parallel for audit.
      const uploadPromise = (async () => {
        const url = await generateUploadUrl({});
        const res = await fetch(url, { method: "POST", body: f });
        if (!res.ok) return null;
        const { storageId } = (await res.json()) as { storageId: string };
        return storageId;
      })();

      const { default: Tesseract } = await import("tesseract.js");
      const result = await Tesseract.recognize(f, "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const text = result?.data?.text ?? "";
      const parsed = parseTesseractText(text);
      const storageId = await uploadPromise;

      if (!parsed.firstName && !parsed.docNumber) {
        // OCR didn't find anything useful — let the user fill fields manually.
        set({ docImageStorageId: storageId, docOcrRawJson: JSON.stringify({ text }) });
        setPhase("manual");
        return;
      }

      set({
        docFirstName: parsed.firstName,
        docLastName: parsed.lastName,
        docNumber: parsed.docNumber,
        docExpiry: parsed.expiryISO,
        docCountry: parsed.country,
        docImageStorageId: storageId,
        docOcrRawJson: JSON.stringify({ text, parsed }),
      });
      setPhase("done");
    } catch (err) {
      console.error("OCR failed", err);
      setPhase("manual");
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title="Verify your ID" step={3} total={7} />
      <ProgressBar step={3} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 100px" }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, margin: "8px 0 16px" }}>
          Upload a photo of your driver's license or passport. We'll fill in your details automatically.
        </p>

        {phase === "idle" && (
          <button onClick={() => fileRef.current?.click()} style={uploadCard}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)" }}>
              <IconUpload size={26} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Upload document photo</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>JPG, PNG or HEIC · max 8 MB</div>
          </button>
        )}

        {phase === "scanning" && (
          <div style={{ ...uploadCard, cursor: "default", borderStyle: "solid" }}>
            <div style={{ position: "relative", width: 220, height: 140, background: "#0a0a0a", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)" }} />
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2, background: "var(--accent)",
                boxShadow: "0 0 12px var(--accent)",
                animation: "scan 1.6s ease-in-out infinite",
              }} />
              <div style={{ position: "absolute", top: 8, left: 8, color: "#fff", fontSize: 10, fontFamily: "JetBrains Mono, monospace", opacity: 0.7 }}>
                SCANNING… {progress}%
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Reading your document</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>This can take ~30 seconds the first time</div>
            <style>{`@keyframes scan { 0% { top: 4%; } 50% { top: 92%; } 100% { top: 4%; } }`}</style>
          </div>
        )}

        {phase === "manual" && (
          <div>
            <div style={{ padding: 12, background: "#fff8f1", border: "1px solid #f5c89e", borderRadius: 12, marginBottom: 14, fontSize: 12.5, color: "#9a4a07" }}>
              We couldn't read your document automatically. Please fill in the fields below — we'll double-check at delivery.
            </div>
            <Field label="First name" value={state.docFirstName} onChange={(v) => set({ docFirstName: v })} />
            <Field label="Last name(s)" value={state.docLastName} onChange={(v) => set({ docLastName: v })} />
            <Field label="Document number" value={state.docNumber} onChange={(v) => set({ docNumber: v })} mono />
            <ExpiryField iso={state.docExpiry} onIsoChange={(v) => set({ docExpiry: v })} />
            <Field label="Country" value={state.docCountry} onChange={(v) => set({ docCountry: v })} />
          </div>
        )}

        {phase === "done" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <IconCheck size={18} color="#16a34a" /> Extracted from your document
            </div>
            <Field label="First name" value={state.docFirstName} onChange={(v) => set({ docFirstName: v })} />
            <Field label="Last name(s)" value={state.docLastName} onChange={(v) => set({ docLastName: v })} />
            <Field label="Document number" value={state.docNumber} onChange={(v) => set({ docNumber: v })} mono />
            <ExpiryField iso={state.docExpiry} onIsoChange={(v) => set({ docExpiry: v })} />
            <Field label="Country" value={state.docCountry} onChange={(v) => set({ docCountry: v })} />
            <button
              onClick={() => {
                setPhase("idle");
                set({ docFirstName: "", docLastName: "", docNumber: "", docExpiry: "", docCountry: "" });
              }}
              style={{
                marginTop: 4, background: "transparent", border: "none", color: "var(--muted)",
                fontSize: 12, padding: 6, display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <IconRefresh size={13} /> Re-scan document
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton
          disabled={!state.docFirstName || !state.docLastName}
          onClick={onNext}
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
