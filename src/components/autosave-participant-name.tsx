"use client";

import { useEffect, useRef, useState } from "react";

export function AutosaveParticipantName({ name, onSave }: {
  name: string;
  onSave: (name: string) => boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saved, setSaved] = useState(false);

  // Accept updates from another tab without interrupting an unfinished edit.
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.value = name;
  }, [name]);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function save() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const input = inputRef.current;
    if (!input || input.value === name) return;
    setSaved(onSave(input.value));
  }

  return <form className="participant-name-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
    <label className="field">
      <span>Participant name</span>
      <input ref={inputRef} name="name" defaultValue={name} required minLength={2} maxLength={80}
        onChange={(event) => {
          setSaved(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          // Don't report errors while someone is replacing a name one character at a time.
          if (event.currentTarget.value.trim().length >= 2) timerRef.current = setTimeout(save, 600);
        }}
        onBlur={save} />
    </label>
    {saved ? <p className="autosave-status" role="status">Saved</p> : null}
  </form>;
}
