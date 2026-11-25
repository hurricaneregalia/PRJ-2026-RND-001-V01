import BackButton from "@/components/ui/back-button";

export default function FormActions({
  submitText = "Simpan",
  cancelText = "Batal",
  submitDisabled = false,
}) {
  return (
    <p>
      <button type="submit" disabled={submitDisabled}>
        {submitText}
      </button>{" "}
      <BackButton btnText={cancelText} />
    </p>
  );
}
