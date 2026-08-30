import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils';
import { Field } from './Field';
import { controlBase, controlInvalid } from './fieldStyles';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, required, ...props }, ref) => {
    return (
      <Field id={id} label={label} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlBase,
            'resize-y px-3 py-2 text-sm leading-relaxed',
            error && controlInvalid,
            className
          )}
          {...props}
        />
      </Field>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
