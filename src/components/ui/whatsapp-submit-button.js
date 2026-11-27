"use client";

import { useFormStatus } from "react-dom";

export default function WhatsAppSubmitButton({
  waUrl,
  disabled = false,
  children,
}) {
  const { pending } = useFormStatus();

  function handleClick() {
    if (!waUrl) {
      return;
    }

    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      onClick={handleClick}
      title="Simpan riwayat kontak dan buka WhatsApp"
    >
      {pending ? "Menyimpan..." : children}
    </button>
  );
}
