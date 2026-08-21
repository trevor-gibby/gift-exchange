"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="copy-field">
      <span title={value}>{value}</span>
      <button className="icon-button" type="button" onClick={copy} aria-label="Copy participant link">
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
}
