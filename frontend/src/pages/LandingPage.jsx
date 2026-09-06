import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../landing.css";

// ── Icons (inline SVG components) ────────────────────────────────────────────

function BloodDropIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
    </svg>
  );
}

function HeartbeatLine({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="0,20 30,20 45,5 55,35 65,12 80,28 95,20 200,20" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

// ── Counter hook ──────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  value,
  suffix = "",
  label,
  icon,
  delay,
  animate,
}) {
  const count = useCountUp(value, 1800, animate);
  return (
    <div
      className="flex flex-col items-center gap-2 px-8 py-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="text-[#DC143C] mb-1">{icon}</div>
      <div style={{ fontFamily: "var(--font-display)" }} className="text-4xl lg:text-5xl font-normal text-white">
        {animate ? count.toLocaleString() : 0}{suffix}
      </div>
      <div className="text-sm text-white/50 tracking-widest uppercase font-medium">{label}</div>
    </div>
  );
}

// ── Blood group data ──────────────────────────────────────────────────────────

const bloodGroups = [
  { group: "A+", units: 342, status: "Available", pct: 78 },
  { group: "A−", units: 87, status: "Low Stock", pct: 22 },
  { group: "B+", units: 215, status: "Available", pct: 61 },
  { group: "B−", units: 41, status: "Critical", pct: 10 },
  { group: "AB+", units: 128, status: "Available", pct: 47 },
  { group: "AB−", units: 29, status: "Critical", pct: 7 },
  { group: "O+", units: 489, status: "Available", pct: 92 },
  { group: "O−", units: 63, status: "Low Stock", pct: 18 },
];

const statusConfig = {
  "Available": { bg: "bg-emerald-950/60", text: "text-emerald-400", dot: "bg-emerald-400" },
  "Low Stock": { bg: "bg-amber-950/60", text: "text-amber-400", dot: "bg-amber-400" },
  "Critical": { bg: "bg-red-950/60", text: "text-red-400", dot: "bg-red-400" },
};

const urgentRequests = [
  { group: "O−", units: 4, hospital: "City General Hospital", status: "Urgent", time: "12 min ago" },
  { group: "AB−", units: 2, hospital: "St. Mary's Medical Center", status: "Critical", time: "47 min ago" },
  { group: "B+", units: 6, hospital: "Northside Healthcare", status: "Pending", time: "2 hrs ago" },
  { group: "A+", units: 3, hospital: "Regional Trauma Center", status: "Urgent", time: "3 hrs ago" },
];

const bloodBanks = [
  { name: "Central Blood Bank", location: "Downtown Medical District", units: 1240, contact: "+1 (800) 555-0101" },
  { name: "Harbor Life Center", location: "Harbor View, East Wing", units: 876, contact: "+1 (800) 555-0187" },
  { name: "Unity Blood Services", location: "Westside Community Hub", units: 634, contact: "+1 (800) 555-0143" },
];

const steps = [
  { num: "01", title: "Register", desc: "Create your donor or receiver profile with a few simple steps." },
  { num: "02", title: "Donate", desc: "Schedule a donation at a certified center near you." },
  { num: "03", title: "Test", desc: "Blood undergoes rigorous quality and safety testing." },
  { num: "04", title: "Save a Life", desc: "Safe, tested blood reaches the person who needs it most." },
];

const navLinks = ["Home", "Blood Banks", "Donors", "Blood Inventory", "Blood Requests", "About"];

// ── App ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-page min-h-full bg-[#0F0F12] text-[#F9F6F3] overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(15,15,18,0.94)"
            : "rgba(15,15,18,0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(139,0,0,0.2)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center blood-glow">
              <BloodDropIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)" }} className="text-lg leading-none text-white">
                LifeFlow
              </div>
              <div className="text-[10px] text-white/40 tracking-wider uppercase leading-none mt-0.5">
                Blood Bank Management
              </div>
            </div>
          </a>

          {/* Center nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-white/60 hover:text-white transition-colors px-3 cursor-pointer">
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[#8B0000] hover:bg-[#B22222] text-white text-sm font-medium rounded-lg transition-all duration-200 blood-glow cursor-pointer"
            >
              Donate Blood
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white/70 hover:text-white cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#0F0F12]/95 backdrop-blur-xl px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a key={link} href="#" className="py-2.5 text-sm text-white/70 hover:text-white border-b border-white/5">
                {link}
              </a>
            ))}
            <div className="flex gap-3 pt-4">
              <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="flex-1 text-center py-2 border border-white/20 rounded-lg text-sm text-white/70 cursor-pointer">
                Login
              </button>
              <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="flex-1 text-center py-2 bg-[#8B0000] rounded-lg text-sm text-white font-medium cursor-pointer">
                Donate Blood
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero section moved to Dashboard */}

      {/* ── LIVE STATISTICS ────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="bg-[#16161A] border-y border-white/[0.06] py-2"
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.07]">
            <StatCard
              value={12480}
              label="Blood Units Available"
              delay={0}
              animate={statsVisible}
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z" />
                </svg>
              }
            />
            <StatCard
              value={38200}
              label="Registered Donors"
              delay={150}
              animate={statsVisible}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
            <StatCard
              value={142}
              label="Blood Banks"
              delay={300}
              animate={statsVisible}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              }
            />
            <StatCard
              value={284}
              label="Pending Requests"
              delay={450}
              animate={statsVisible}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ── BLOOD INVENTORY ────────────────────────────────────────────────── */}
      <section id="inventory" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs text-[#DC143C] tracking-widest uppercase font-medium mb-3">Live Inventory</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl lg:text-4xl xl:text-5xl text-white mb-4">
              Blood Availability at a Glance
            </h2>
            <p className="text-white/50 max-w-xl mx-auto text-base">
              Quickly check available blood groups across our network.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodGroups.map((bg, i) => {
              const cfg = statusConfig[bg.status];
              return (
                <div
                  key={bg.group}
                  className="glass-dark rounded-2xl p-5 card-hover cursor-pointer"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      style={{ fontFamily: "var(--font-display)" }}
                      className="text-3xl text-white font-normal"
                    >
                      {bg.group}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase ${cfg.bg} ${cfg.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {bg.status}
                    </span>
                  </div>

                  {/* Level bar */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${bg.pct}%`,
                        background:
                          bg.pct > 50
                            ? "linear-gradient(90deg, #8B0000, #DC143C)"
                            : bg.pct > 20
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                    />
                  </div>

                  <div className="text-sm text-white/70 font-medium">
                    {bg.units.toLocaleString()} <span className="text-white/30 text-xs">units</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── URGENT REQUESTS ────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#16161A]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs text-[#DC143C] tracking-widest uppercase font-medium mb-3">Real-time</div>
              <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl lg:text-4xl text-white">
                Urgent Blood Requests
              </h2>
            </div>
            <a
              href="#"
              className="text-sm text-[#DC143C] hover:text-[#FF4444] transition-colors font-medium shrink-0"
            >
              View All Requests →
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {urgentRequests.map((req, i) => (
              <div
                key={i}
                className="glass-dark rounded-2xl p-5 border-l-2 card-hover"
                style={{
                  borderLeftColor:
                    req.status === "Critical"
                      ? "#EF4444"
                      : req.status === "Urgent"
                      ? "#DC143C"
                      : "#8B0000",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-2xl text-white"
                  >
                    {req.group}
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full ${
                      req.status === "Critical"
                        ? "bg-red-950/70 text-red-400"
                        : req.status === "Urgent"
                        ? "bg-[#8B0000]/40 text-[#FF6B6B]"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mb-1">{req.hospital}</div>
                <div className="text-xs text-white/40 mb-3">{req.units} units required</div>
                <div
                  className="text-[10px] text-white/30 tracking-wide"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {req.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOOD BANK NETWORK ─────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1' fill='%23fff'/%3E%3Ccircle cx='0' cy='0' r='1' fill='%23fff'/%3E%3Ccircle cx='60' cy='0' r='1' fill='%23fff'/%3E%3Ccircle cx='0' cy='60' r='1' fill='%23fff'/%3E%3Ccircle cx='60' cy='60' r='1' fill='%23fff'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="text-xs text-[#DC143C] tracking-widest uppercase font-medium mb-3">Our Network</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl lg:text-4xl xl:text-5xl text-white mb-4">
              Find a Blood Bank Near You
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {bloodBanks.map((bank, i) => (
              <div key={i} className="glass-dark rounded-2xl p-6 card-hover">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#8B0000]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPinIcon />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">{bank.name}</div>
                    <div className="text-sm text-white/40 mt-0.5">{bank.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <BloodDropIcon className="w-4 h-4 text-[#DC143C]" />
                  <span className="text-sm text-white/70">
                    <strong className="text-white">{bank.units.toLocaleString()}</strong> units available
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <PhoneIcon />
                    {bank.contact}
                  </div>
                  <a
                    href="#"
                    className="text-xs text-[#DC143C] hover:text-[#FF4444] font-medium transition-colors"
                  >
                    View details →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#8B0000]/50 hover:border-[#8B0000] hover:bg-[#8B0000]/10 text-[#DC143C] rounded-xl text-sm font-medium transition-all duration-200"
            >
              Explore All Blood Banks →
            </a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#16161A]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-xs text-[#DC143C] tracking-widest uppercase font-medium mb-3">Process</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl lg:text-4xl xl:text-5xl text-white">
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#8B0000]/40 to-transparent" />

            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div
                  className="w-16 h-16 rounded-2xl bg-[#8B0000]/15 border border-[#8B0000]/30 flex items-center justify-center mb-5 relative z-10"
                >
                  <span
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-sm font-medium text-[#DC143C]"
                  >
                    {step.num}
                  </span>
                </div>
                <div
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-xl text-white mb-2"
                >
                  {step.title}
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONOR CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(139,0,0,0.35) 0%, rgba(90,0,0,0.15) 40%, transparent 70%), #0F0F12",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <BloodDropIcon className="w-12 h-12 text-[#DC143C] mx-auto mb-6 opacity-60" />
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl lg:text-5xl xl:text-6xl text-white mb-6 leading-tight"
          >
            Your Blood Could Be
            <br />
            <em className="not-italic text-[#DC143C]">Someone's Second Chance.</em>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            A single donation can make a meaningful difference. Join our donor
            network today and help save lives in your community.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#8B0000] hover:bg-[#B22222] text-white font-semibold rounded-2xl transition-all duration-200 blood-glow text-base cursor-pointer"
          >
            Become a Donor →
          </button>

          <HeartbeatLine className="text-[#8B0000]/30 w-full max-w-sm mx-auto mt-12 animate-heartbeat" />
        </div>
      </section>

      {/* ── PLATFORM INSIGHTS ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#16161A]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs text-[#DC143C] tracking-widest uppercase font-medium mb-3">Analytics</div>
            <h2 style={{ fontFamily: "var(--font-display)" }} className="text-3xl lg:text-4xl text-white mb-3">
              Platform Insights
            </h2>
            <p className="text-white/40 text-sm">This month's impact at a glance</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Donations This Month", value: "1,842", delta: "+12%", bar: 72 },
              { label: "Blood Units Distributed", value: "9,210", delta: "+8%", bar: 58 },
              { label: "Active Donors", value: "3,504", delta: "+21%", bar: 85 },
              { label: "Successful Requests", value: "2,176", delta: "+6%", bar: 64 },
            ].map((item, i) => (
              <div key={i} className="glass-dark rounded-2xl p-6 card-hover">
                <div className="text-xs text-white/40 uppercase tracking-widest mb-4">{item.label}</div>
                <div
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-3xl text-white mb-1"
                >
                  {item.value}
                </div>
                <div className="text-xs text-emerald-400 font-medium mb-5">{item.delta} vs last month</div>
                {/* Mini chart */}
                <div className="flex items-end gap-0.5 h-10">
                  {Array.from({ length: 12 }, (_, j) => {
                    const h = 20 + Math.sin((j + i) * 1.2) * 15 + Math.random() * 10;
                    return (
                      <div
                        key={j}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background:
                            j === 11
                              ? "linear-gradient(to top, #8B0000, #DC143C)"
                              : "rgba(255,255,255,0.08)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0A0D] border-t border-white/[0.06] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#8B0000] flex items-center justify-center blood-glow">
                  <BloodDropIcon className="w-5 h-5 text-white" />
                </div>
                <span style={{ fontFamily: "var(--font-display)" }} className="text-xl text-white">
                  LifeFlow
                </span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                Connecting blood donors, blood banks, and healthcare teams across the network — saving lives, one drop at a time.
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-4 font-medium">Platform</div>
              <div className="flex flex-col gap-2">
                {["Home", "Blood Banks", "Donors", "Inventory", "Requests"].map((l) => (
                  <a key={l} href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {l}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-4 font-medium">Company</div>
              <div className="flex flex-col gap-2">
                {["About", "Contact", "Privacy", "Terms"].map((l) => (
                  <a key={l} href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/25" style={{ fontFamily: "var(--font-mono)" }}>
              © 2026 LifeFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/30">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
