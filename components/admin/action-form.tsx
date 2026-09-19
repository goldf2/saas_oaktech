"use client";

import { useActionState, useRef, type ReactNode } from "react";
import type { AdminActionResult } from "@/lib/store/types";
import { useLocale } from "@/i18n/locale-provider";

export function AdminActionForm({
  action,
  children,
  className,
  pendingText,
}: {
  action: (data: FormData) => Promise<AdminActionResult>;
  children: ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { locale } = useLocale();
  const resolvedPendingText = pendingText ?? (locale === "zh" ? "正在保存，请勿重复提交…" : "Saving… please do not submit again.");
  const preserveInputs = useRef(false);
  const [state, formAction, pending] = useActionState<AdminActionResult, FormData>(
    async (_previous, data) => {
      preserveInputs.current = false;
      const result = await action(data);
      preserveInputs.current = Boolean(result.error);
      return result;
    },
    {},
  );

  return (
    <form action={formAction} className={className} aria-busy={pending}
      onReset={(event) => { if (preserveInputs.current) event.preventDefault(); }}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state.error && <p role="alert" className="w-full text-sm text-destructive">{state.error}</p>}
      {pending && <p role="status" className="w-full text-sm text-muted-foreground">{resolvedPendingText}</p>}
    </form>
  );
}
