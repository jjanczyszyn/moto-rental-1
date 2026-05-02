import { useReducer, useCallback } from "react";

export interface SignatureDraft {
  mode: "draw" | "type";
  drawn?: boolean;
  pngBlob?: Blob | null;
  typed?: string;
}

export interface ReservationDraft {
  startDate: Date | null;
  endDate: Date | null;
  bikeId: string | null; // Convex Id<"bikes"> as string
  bikeSlug: string | null;
  docFirstName: string;
  docLastName: string;
  docNumber: string;
  docExpiry: string;
  docCountry: string;
  docOcrRawJson: string | null;
  docImageStorageId: string | null;
  phoneCC: string;
  phoneNum: string;
  phoneNote?: string;
  payMethod: string | null;
  signature: SignatureDraft | null;
  signaturePngStorageId: string | null;
  deliveryAddr: string;
  deliveryHour: number | null;
}

const INITIAL: ReservationDraft = {
  startDate: null,
  endDate: null,
  bikeId: null,
  bikeSlug: null,
  docFirstName: "",
  docLastName: "",
  docNumber: "",
  docExpiry: "",
  docCountry: "",
  docOcrRawJson: null,
  docImageStorageId: null,
  phoneCC: "+505",
  phoneNum: "",
  phoneNote: undefined,
  payMethod: null,
  signature: null,
  signaturePngStorageId: null,
  deliveryAddr: "",
  deliveryHour: null,
};

type Action =
  | { type: "patch"; patch: Partial<ReservationDraft> }
  | { type: "reset" };

function reducer(state: ReservationDraft, action: Action): ReservationDraft {
  switch (action.type) {
    case "patch": return { ...state, ...action.patch };
    case "reset": return INITIAL;
  }
}

export function useReservationDraft() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const set = useCallback((patch: Partial<ReservationDraft>) => dispatch({ type: "patch", patch }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  return { state, set, reset };
}

export function toISODate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
