import { CircleAlert, PartyPopper } from "lucide-react";

export function MessageBanner({ error, notice }: { error?: string; notice?: string }) {
  const message = error ?? notice;
  if (!message) return null;

  return (
    <div className={error ? "alert alert-error page-alert" : "alert alert-success page-alert"} role="status">
      {error ? <CircleAlert size={18} /> : <PartyPopper size={18} />}
      {message}
    </div>
  );
}
