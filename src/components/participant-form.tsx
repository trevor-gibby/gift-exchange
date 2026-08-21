"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addParticipantAction } from "@/actions/exchanges";

export function ParticipantForm({ eventId }: { eventId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submissionCount, action, pending] = useActionState(async (count: number, formData: FormData) => {
    await addParticipantAction(formData);
    return count + 1;
  }, 0);

  useEffect(() => {
    if (submissionCount > 0) formRef.current?.reset();
  }, [submissionCount]);

  return (
    <form ref={formRef} action={action} className="add-person-form">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="field compact-field">
        <span>Name</span>
        <input name="name" required minLength={2} maxLength={80} placeholder="Alex Rivera" />
      </label>
      <label className="field compact-field">
        <span>Email <small>Optional</small></span>
        <input name="email" type="email" placeholder="alex@example.com" />
      </label>
      <button className="button button-primary add-person-button" type="submit" disabled={pending}>
        <Plus size={18} /> {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
