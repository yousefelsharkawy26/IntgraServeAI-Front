import FormLogin from '@/features/authentication/login/FormLogin';
import { Bot, CheckCircle2, Headset, Shield, TrendingUp } from 'lucide-react';

const stats = [
  { value: '2,500+', label: 'Tickets resolved' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '<2h', label: 'Avg. response time' },
];

const features = [
  { icon: Headset, text: 'Unified multi-channel ticket management' },
  { icon: Shield, text: 'Role-based access — Admin, Support & Tech' },
  { icon: TrendingUp, text: 'Real-time analytics and reporting' },
];

const Login = () => {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* ══ Left brand panel ══════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[46%] lg:flex-col xl:w-[42%]">
        {/* Gradient fill */}
        <div className="from-primary absolute inset-0 bg-linear-to-br via-indigo-600 to-violet-700" />

        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.12]!"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute -top-40 -left-40 h-112! w-md! rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80! w-80! rounded-full bg-violet-400/20 blur-3xl" />

        {/* Content — 3-row flex column */}
        <div className="relative flex h-full! w-full! flex-col justify-between p-10! text-white xl:p-14!">
          {/* Row 1 — Logo */}
          <div className="flex items-center gap-3!">
            <div className="flex h-10! w-10! items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
              <Bot className="h-5! w-5! text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              intgraServeAI
            </span>
          </div>

          {/* Row 2 — Hero content */}
          <div className="space-y-8!">
            <div className="space-y-4!">
              <h1 className="text-4xl! leading-tight font-bold xl:text-5xl!">
                AI‑Powered
                <br />
                Customer Service
              </h1>
              <p className="max-w-sm! text-base leading-relaxed text-white/70">
                Resolve tickets faster, empower your team, and delight every
                customer — all from one smart platform.
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3!">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3!">
                  <div className="mt-0.5! flex h-6! w-6! shrink-0! items-center justify-center rounded-md bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-3.5! w-3.5!" />
                  </div>
                  <span className="text-sm leading-relaxed text-white/85">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Stats strip */}
            <div className="grid grid-cols-3 divide-x divide-white/20 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              {stats.map(({ value, label }) => (
                <div key={label} className="px-3! py-4! text-center">
                  <div className="text-xl! font-bold xl:text-2xl!">{value}</div>
                  <div className="mt-0.5! text-[11px]! text-white/55 xl:text-xs!">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3 — Footer */}
          <p className="text-[11px]! text-white/30">
            © {new Date().getFullYear()} intgraServeAI · All rights reserved.
          </p>
        </div>
      </div>

      {/* ══ Right form panel ══════════════════════════════════════════ */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6! py-12! sm:px-10!">
        <div className="w-full! max-w-[360px]! space-y-7!">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5! lg:hidden">
            <div className="bg-primary flex h-9! w-9! items-center justify-center rounded-xl">
              <Bot className="h-5! w-5! text-white" />
            </div>
            <span className="text-primary text-xl! font-bold">
              intgraServeAI
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5!">
            <h2 className="text-2xl! font-bold tracking-tight">
              Welcome back 👋
            </h2>
            <p className="text-muted-foreground text-sm!">
              Sign in to your workspace to continue
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card ring-border/50 rounded-2xl border p-7! shadow-sm ring-1">
            <FormLogin classNames={{ inputClassName: '' }} />
          </div>

          {/* Trust badge */}
          <div className="text-muted-foreground flex items-center justify-center gap-1.5! text-xs!">
            <CheckCircle2 className="h-3.5! w-3.5!" />
            <span>Secured with JWT authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
