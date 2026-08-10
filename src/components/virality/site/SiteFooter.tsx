import { RobinzoneMark } from "./RobinzoneMark";

const linkBase =
  "text-[13px] text-sky-100/80 font-normal hover:text-sky transition-colors cursor-pointer flex items-center gap-[7px]";
const colTitle = "text-[11px] font-bold tracking-[0.16em] uppercase text-sky mb-4";

const inlineTag = (text: string, color: "volt" | "plasma" | "violet" | "lime") => {
  const map = {
    volt: "text-[#C8FF00] bg-[rgba(200,255,0,0.10)] border-[rgba(200,255,0,0.22)]",
    plasma: "text-[#00C2FF] bg-[rgba(0,194,255,0.10)] border-[rgba(0,194,255,0.22)]",
    violet: "text-[#9F6EFF] bg-[rgba(159,110,255,0.10)] border-[rgba(159,110,255,0.22)]",
    lime: "text-[#39FF88] bg-[rgba(57,255,136,0.10)] border-[rgba(57,255,136,0.22)]",
  } as const;
  return (
    <span
      className={`text-[8px] font-bold tracking-[0.1em] uppercase px-[6px] py-[2px] rounded-full border ${map[color]}`}
    >
      {text}
    </span>
  );
};

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-sky/20 bg-[#03131a]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 10% 40%, rgba(0,194,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 55% 70% at 90% 30%, rgba(0,194,255,0.14) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 50% 110%, rgba(0,194,255,0.10) 0%, transparent 55%)",
        }}
      />

      {/* TOP — Brand banner */}
      <div className="px-6 sm:px-8 lg:px-12 pt-10 sm:pt-[52px] pb-8 sm:pb-10 relative z-10">
        <div className="max-w-[44ch]">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <RobinzoneMark size={34} radius={8} />
            <span className="font-display text-[1.25rem] font-extrabold tracking-[-0.04em] text-white">
              Robinzone
            </span>
          </div>
          <p className="text-[13px] text-sky-100/75 font-normal leading-relaxed mb-[14px]">
            Your AI content creation basecamp. Hundreds of models, one subscription.
          </p>
        </div>
      </div>

      {/* MIDDLE — Link columns (1 row from tablet up) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10 px-6 sm:px-8 lg:px-12 pb-10 sm:pb-11 border-b border-sky/15 relative z-10">
        <div>
          <div className={colTitle}>Product</div>
          <div className="flex flex-col gap-[9px]">
            <span className={linkBase}>AI Models</span>
            <span className={linkBase}>Creation Studio</span>
            <span className={linkBase}>Pricing</span>
          </div>
        </div>

        <div>
          <div className={colTitle}>Resources</div>
          <div className="flex flex-col gap-[9px]">
            <span className={linkBase}>Help Center</span>
          </div>
        </div>

        <div>
          <div className={colTitle}>Company</div>
          <div className="flex flex-col gap-[9px]">
            <span className={linkBase}>About</span>
            <span className={linkBase}>Careers {inlineTag("Hiring", "volt")}</span>
            <span className={linkBase}>Contact</span>
          </div>
        </div>

        <div>
          <div className={colTitle}>Legal</div>
          <div className="flex flex-col gap-[9px]">
            <span className={linkBase}>Terms of Use</span>
            <span className={linkBase}>Privacy Policy</span>
            <span className={linkBase}>Cookie Policy</span>
            <span className={linkBase}>Billing Terms</span>
            <span className={linkBase}>Refund Policy</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-8 lg:px-12 py-5 sm:py-[18px] relative z-10 gap-4">
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-[11px] text-sky-100/65">
          <span>© {new Date().getFullYear()} Robinzone</span>
          <span className="hidden sm:inline">·</span>
          <address className="not-italic leading-relaxed">
            ONLYAPPS LTD., Makariou III, 228, Agios Pavlos Court A, 7th floor,
            Flat/Office 712, 3030 Limassol, Cyprus
          </address>
        </div>
      </div>
    </footer>
  );
}
