"use client";

import { useActionState, useRef } from "react";
import { saveExclusionsAction } from "@/actions/exchanges";
import { ExclusionPopover } from "@/components/exclusion-popover";

type Recipient = {
  id: string;
  name: string;
};

export function ExclusionEditor({
  eventId,
  giverId,
  giverName,
  recipients,
  selectedRecipientIds,
}: {
  eventId: string;
  giverId: string;
  giverName: string;
  recipients: Recipient[];
  selectedRecipientIds: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saveCount, action, pending] = useActionState(async (count: number, formData: FormData) => {
    await saveExclusionsAction(formData);
    return count + 1;
  }, 0);
  const selected = new Set(selectedRecipientIds);

  function autosave() {
    window.requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <ExclusionPopover label={`Edit exclusions for ${giverName}`} title={`Exclusions for ${giverName}`}>
        <p><strong>{giverName}</strong> cannot draw:</p>
        <form ref={formRef} action={action} onChange={autosave}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="giverId" value={giverId} />
          <div className="checkbox-list">
            {recipients.map((recipient) => (
              <label key={recipient.id}>
                <input
                  type="checkbox"
                  name="recipientId"
                  value={recipient.id}
                  defaultChecked={selected.has(recipient.id)}
                />
                <span>{recipient.name}</span>
              </label>
            ))}
          </div>
          {pending || saveCount > 0 ? (
            <p className={`autosave-status ${pending ? "is-saving" : ""}`} aria-live="polite">
              {pending ? "Saving…" : "Saved"}
            </p>
          ) : null}
        </form>
    </ExclusionPopover>
  );
}
