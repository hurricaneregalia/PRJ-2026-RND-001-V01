"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ disabled, submitText, pendingText }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending}>
      {pending ? pendingText : submitText}
    </button>
  );
}

export default function RequiredFieldsForm({
  action,
  children,
  submitText = "Simpan",
  pendingText = "Menyimpan...",
}) {
  const formRef = useRef(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(Boolean(formRef.current?.checkValidity()));
  }, []);

  function syncValidity() {
    setIsValid(Boolean(formRef.current?.checkValidity()));
  }

  return (
    <form
      ref={formRef}
      action={action}
      onInput={syncValidity}
      onChange={syncValidity}
    >
      {children}
      <p>
        <SubmitButton
          disabled={!isValid}
          submitText={submitText}
          pendingText={pendingText}
        />
      </p>
    </form>
  );
}
