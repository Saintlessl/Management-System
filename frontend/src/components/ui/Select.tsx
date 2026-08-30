import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
import { Field } from './Field';
import { controlBase, controlHeight, controlInvalid } from './fieldStyles';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, placeholder, required, ...props }, ref) => {
    return (
      <Field id={id} label={label} error={error} hint={hint} required={required}>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(
              controlBase,
              controlHeight,
              'appearance-none pr-9',
              error && controlInvalid,
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted/80"
            aria-hidden="true"
          />
        </div>
      </Field>
    );
  }
);

Select.displayName = 'Select';

export { Select };
