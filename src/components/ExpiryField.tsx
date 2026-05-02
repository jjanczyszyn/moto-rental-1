import React from "react";
import { Field } from "./Common";
import { formatExpiryDisplay, parseExpiryInput } from "../lib/dates";

// Editable expiry field. Shows the value as dd-mm-YYYY but stores it as
// ISO YYYY-MM-DD on the parent state. Holds the raw typed text locally so
// the user can type freely; only commits a non-empty ISO when the input
// parses to a real calendar date.
export function ExpiryField({
  iso,
  onIsoChange,
}: {
  iso: string;
  onIsoChange: (iso: string) => void;
}) {
  const [text, setText] = React.useState<string>(() => formatExpiryDisplay(iso));

  // Keep the displayed text in sync if the parent ISO is replaced from the
  // outside (OCR result, "re-scan", quick-fill, etc.).
  React.useEffect(() => {
    const fromIso = formatExpiryDisplay(iso);
    setText((cur) => {
      const parsedCur = parseExpiryInput(cur).iso;
      return parsedCur === iso ? cur : fromIso;
    });
  }, [iso]);

  const handleChange = (v: string) => {
    setText(v);
    const { iso: parsed } = parseExpiryInput(v);
    if (parsed !== iso) onIsoChange(parsed);
  };

  return (
    <Field
      label="Expiry date (dd-mm-YYYY)"
      value={text}
      onChange={handleChange}
      mono
      placeholder="dd-mm-YYYY"
    />
  );
}
