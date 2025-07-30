
'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends ButtonProps {
  children: React.ReactNode;
  pending?: boolean; // Accept an optional pending prop
}

export function SubmitButton({ children, className, pending: propPending, ...props }: SubmitButtonProps) {
  const { pending: domPending } = useFormStatus();
  const isPending = propPending || domPending;

  return (
    <Button
      type="submit"
      aria-disabled={isPending}
      disabled={isPending}
      className={className}
      {...props}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
