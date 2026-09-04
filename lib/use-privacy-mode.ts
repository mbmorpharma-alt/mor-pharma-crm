"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "crm_privacy_mode";
const EVENT = "crm-privacy-mode-changed";

export function usePrivacyMode() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === "1");
    function onChange() {
      setHidden(localStorage.getItem(KEY) === "1");
    }
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = localStorage.getItem(KEY) !== "1";
    localStorage.setItem(KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { hidden, toggle };
}

export function maskPhone(phone: string) {
  return phone.replace(/\d/g, "•");
}

export function formatMoney(value: number, hidden: boolean) {
  return hidden ? "₪ ••••" : `₪${value.toLocaleString()}`;
}
