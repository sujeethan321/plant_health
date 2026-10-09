import { useId } from "react";

export default function Field({ label, error, as: Control = "input", children, ...props }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <Control {...props} id={id} aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}>{children}</Control>
      {error && <small id={`${id}-error`} className="error">{error}</small>}
    </label>
  );
}
