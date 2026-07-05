"use client";

import { useRef } from "react";
import { ROLE_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { updateRoleStatus } from "@/app/actions";

export default function StageSelect({
  roleId,
  status,
  className,
}: {
  roleId: string;
  status: string;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateRoleStatus}>
      <input type="hidden" name="role_id" value={roleId} />
      <select
        name="status"
        defaultValue={status}
        onClick={(e) => e.stopPropagation()}
        onChange={() => formRef.current?.requestSubmit()}
        className={
          className ??
          "cursor-pointer font-mono text-[10.5px] text-text-tertiary outline-none transition-colors hover:text-text-primary"
        }
      >
        {ROLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
