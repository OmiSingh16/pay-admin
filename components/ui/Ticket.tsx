import { ReactNode } from "react";

interface TicketProps {
  header: ReactNode;
  footer: ReactNode;
}

export function Ticket({ header, footer }: TicketProps) {
  return (
    <div className="w-full max-w-[480px] relative filter drop-shadow-[0_18px_30px_rgba(15,26,43,0.18)]">
      {/* Top Half */}
      <div className="bg-[var(--panel)] rounded-t-[var(--r)] px-6 pt-6 pb-5 ticket-mask-top">
        {header}
      </div>
      
      {/* Bottom Half */}
      <div className="bg-[var(--panel)] rounded-b-[var(--r)] px-6 pt-5 pb-6 border-t-2 border-dashed border-[var(--line)] ticket-mask-bot">
        {footer}
      </div>
    </div>
  );
}