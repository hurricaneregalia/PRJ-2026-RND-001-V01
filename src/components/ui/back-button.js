"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ btnText = "Kembali" }) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()}>
      {btnText}
    </button>
  );
}
