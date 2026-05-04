import React from "react";
import { IconCash, IconBank } from "./Icons";
import { assetUrl } from "../lib/assets";

// Brand SVGs live in public/assets/payment/ (downloaded from simpleicons.org).
// Cash and bank transfers fall back to the generic line icons.
const BRAND_ICON_BY_ID: Record<string, string> = {
  venmo:   "assets/payment/venmo.svg",
  zelle:   "assets/payment/zelle.svg",
  paypal:  "assets/payment/paypal.svg",
  wise:    "assets/payment/wise.svg",
  revolut: "assets/payment/revolut.svg",
};

export function PaymentIcon({ id, size = 22 }: { id: string; size?: number }) {
  if (id === "cash") return <IconCash size={size} />;
  const src = BRAND_ICON_BY_ID[id];
  if (src) {
    return (
      <img
        src={assetUrl(src)}
        alt=""
        aria-hidden="true"
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }
  // transfer-usd / transfer-eur / anything else
  return <IconBank size={size} />;
}
