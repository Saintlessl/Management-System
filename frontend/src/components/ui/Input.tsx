import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';
import { Field } from './Field';
import { controlBase, controlHeight, controlInvalid } from './fieldStyles';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading adornment, e.g. a search glyph. Renders inside the control. */
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, type, disabled, required, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && isPasswordVisible ? 'text' : type;

    return (
      <Field id={id} label={label} error={error} hint={hint} required={required}>
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-foreground-muted/80"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={inputType}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(
              controlBase,
              controlHeight,
              icon && 'pl-9',
              isPassword && 'pr-10',
              error && controlInvalid,
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              disabled={disabled}
              aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={isPasswordVisible}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-foreground-muted/80 transition-colors hover:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
      </Field>
    );
  }
);

Input.displayName = 'Input';

export { Input };
