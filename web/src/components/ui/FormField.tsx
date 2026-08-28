import { InputHTMLAttributes, forwardRef } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * An underlined blank, not a bordered box — the intake-form register reads
 * as a field to fill in rather than another rounded SaaS input.
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, className = "", ...props },
  ref
) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </span>
      <input
        ref={ref}
        {...props}
        className={`w-full border-0 border-b border-rule bg-transparent px-0 py-2 font-mono text-sm text-ink placeholder:text-ink-muted focus:border-accent ${className}`}
      />
    </label>
  );
});
