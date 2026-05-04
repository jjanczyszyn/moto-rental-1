import React from "react";
import { IconBank, IconCard } from "./Icons";
import { assetUrl } from "../lib/assets";

// Brand SVGs live in public/assets/payment/ (downloaded from simpleicons.org).
const BRAND_ICON_BY_ID: Record<string, string> = {
  venmo:    "assets/payment/venmo.svg",
  zelle:    "assets/payment/zelle.svg",
  paypal:   "assets/payment/paypal.svg",
  wise:     "assets/payment/wise.svg",
  revolut:  "assets/payment/revolut.svg",
  applepay: "assets/payment/applepay.svg",
};

export function PaymentIcon({ id, size = 22 }: { id: string; size?: number }) {
  // Cash on delivery: the "money with wings" emoji renders as green dollar
  // on every modern OS — instantly readable.
  if (id === "cash") {
    return (
      <span
        aria-hidden="true"
        style={{
          fontSize: size,
          lineHeight: 1,
          fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
        }}
      >
        💸
      </span>
    );
  }
  if (id === "card") return <IconCard size={size} />;
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
