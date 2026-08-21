import { Gift, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>
          <Gift size={15} aria-hidden="true" /> Gift Exchange
        </p>
        <p>
          Made for merry moments <Heart size={14} aria-label="with love" />
        </p>
      </div>
    </footer>
  );
}
