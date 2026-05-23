import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TuinRadar — Persoonlijk tuinadvies voor elk seizoen",
  description: "Ontdek wat jouw tuin nodig heeft. TuinRadar combineert plantdetectie, lokaal weer en jouw tuinprofiel tot persoonlijk maandadvies.",
};

/* ── Homepage (server component) ──────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f3f4ee] text-[#1f2a1a]">
      <SiteNav />
      <Hero />
      <HowItWorks />
      <ExampleReport />
      <Features />
      <BottomCTA />
      <SiteFooter />
    </div>
  );
}

/* ── Nav ───────────────────────────────────────────────── */

function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#141c12]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <span className="font-serif text-xl text-white">TuinRadar</span>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a04e25]"
        >
          Start gratis analyse
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

/* ── Hero ──────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-[#141c12] text-white flex items-center">

      {/* Dot grid texture */}
      <div className="pointer-events-none absolute inset-0 select-none opacity-[0.045]"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

      {/* Large botanical illustration — right */}
      <div className="pointer-events-none absolute bottom-0 right-0 h-full w-1/2 select-none overflow-hidden">
        <svg viewBox="0 0 500 700" fill="none" className="h-full w-full translate-x-1/4 opacity-[0.055]" aria-hidden="true">
          {/* Stem */}
          <path d="M250 680 C250 580 220 480 210 380 C200 280 230 200 250 60" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Leaves */}
          <path d="M210 380 C160 340 100 300 80 240 C120 250 180 290 210 380Z" fill="white" opacity="0.9" />
          <path d="M220 420 C280 370 340 310 370 240 C330 260 270 310 220 420Z" fill="white" opacity="0.8" />
          <path d="M215 300 C170 250 130 180 140 120 C170 150 210 230 215 300Z" fill="white" opacity="0.7" />
          <path d="M235 330 C295 270 350 190 340 130 C310 165 265 250 235 330Z" fill="white" opacity="0.75" />
          <path d="M205 460 C145 430 95 390 70 330 C115 345 165 390 205 460Z" fill="white" opacity="0.65" />
          <path d="M225 490 C290 450 345 400 360 330 C320 355 265 400 225 490Z" fill="white" opacity="0.6" />
          {/* Flower top */}
          <circle cx="250" cy="55" r="28" fill="white" opacity="0.5" />
          <circle cx="250" cy="55" r="14" fill="white" opacity="0.7" />
          <circle cx="222" cy="42" r="10" fill="white" opacity="0.45" />
          <circle cx="278" cy="42" r="10" fill="white" opacity="0.45" />
          <circle cx="222" cy="70" r="10" fill="white" opacity="0.45" />
          <circle cx="278" cy="70" r="10" fill="white" opacity="0.45" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6b9e45]" />
            Gratis demo beschikbaar
          </span>

          <h1 className="font-serif mt-7 text-[3rem] leading-[1.06] tracking-tight text-white md:text-[4.2rem]">
            Persoonlijk tuinadvies voor elk seizoen
          </h1>

          <p className="mt-6 max-w-lg text-[16px] leading-[1.85] text-white/45">
            TuinRadar combineert plantdetectie, lokale weerdata en jouw tuinprofiel
            tot persoonlijk seizoensadvies voor deze maand.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/app"
              className="inline-flex items-center gap-2.5 rounded-xl bg-clay px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg transition hover:bg-[#a04e25] hover:shadow-xl active:scale-[0.98]">
              Start gratis analyse
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a href="#voorbeeld"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-[15px] font-semibold text-white/80 transition hover:bg-white/10">
              Bekijk voorbeeld
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-12 flex flex-wrap items-center gap-6">
            {[
              "Geen account nodig",
              "Pl@ntNet plantherkenning",
              "Actuele weerdata",
            ].map((t) => (
              <span key={t} className="flex items-center gap-2 text-[12px] text-white/35">
                <svg className="h-3.5 w-3.5 text-[#6b9e45]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "1",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      title: "Vul je tuinprofiel in",
      text: "Vertel kort welk type tuin je hebt, hoeveel zon er komt en wat je deze maand vooral wilt verbeteren.",
    },
    {
      n: "2",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      title: "Voeg plantfoto's toe",
      text: "Upload 4 tot 7 close-ups van planten. Via Pl@ntNet krijg je suggesties die je zelf bevestigt of corrigeert.",
    },
    {
      n: "3",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      title: "Ontvang persoonlijk rapport",
      text: "Je krijgt jouw Tuin-DNA, watergeefadvies per dag, plantenzorg op maat en korte aandachtspunten.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay">Zo werkt het</p>
          <h2 className="font-serif mt-3 text-[2rem] text-[#1f2a1a] md:text-[2.6rem]">In drie stappen naar tuinadvies</h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.8] text-stone-500">
            Geen account, geen ingewikkeld gedoe. Alleen jouw adres, tuinprofiel en plantfoto's.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.n} className="relative rounded-2xl bg-[#f3f4ee] p-7">
              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block">
                  <svg className="h-5 w-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              )}
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-leaf-700">{step.icon}</span>
                <span className="font-serif text-3xl text-stone-200">{step.n}</span>
              </div>
              <h3 className="font-semibold text-leaf-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-500">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/app"
            className="inline-flex items-center gap-2 rounded-xl bg-leaf-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-leaf-800">
            Begin direct — gratis
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Example report (static mock) ─────────────────────── */

function ExampleReport() {
  return (
    <section id="voorbeeld" className="bg-[#f3f4ee] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay">Voorbeeld</p>
          <h2 className="font-serif mt-3 text-[2rem] text-[#1f2a1a] md:text-[2.6rem]">Jouw tuin deze maand</h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.8] text-stone-500">
            Dit is hoe jouw persoonlijk tuinrapport eruitziet — afgestemd op jouw adres, planten en het actuele weer.
          </p>
        </div>

        {/* Mock report card */}
        <div className="mt-12 overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]">

          {/* Report header bar */}
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-clay">Persoonlijk tuinrapport</p>
              <p className="font-serif text-lg text-leaf-900">Herengracht 42, Amsterdam</p>
            </div>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-400">
              TuinRadar · {new Date().toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="grid gap-0 md:grid-cols-2">

            {/* Score + profiel */}
            <div className="border-b border-stone-100 p-6 md:border-b-0 md:border-r">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Jouw tuin in één oogopslag</p>
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 shrink-0">
                  <svg className="-rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e8ede4" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#3d6020" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray="185 263.9" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-leaf-900">72</span>
                    <span className="text-[9px] text-stone-400">/ 100</span>
                  </div>
                </div>
                <div>
                  <span className="inline-block rounded-full bg-leaf-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-leaf-700">stabiel</span>
                  <p className="mt-2 font-semibold text-leaf-900">Onderhoudsvriendelijke stadstuin</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">Zonnige ligging · gemiddelde biodiversiteit</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  ["Ligging", "Zonnige binnenstad"],
                  ["Risico", "Laag"],
                  ["Biodiversiteit", "58 / 100"],
                  ["Droogtestress", "Gemiddeld"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#f3f4ee] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
                    <p className="mt-0.5 text-xs font-medium text-leaf-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Maandadvies */}
            <div className="border-b border-stone-100 p-6">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Deze maand in jouw tuin</p>
              <p className="text-sm leading-7 text-stone-700">
                Het is nu het moment om droogteresistente planten extra water te geven in de ochtend. Hortensias profiteren van een laagje compost rond de wortels. Controleer je klimop op nieuwe uitlopers langs muren.
              </p>
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-leaf-50 p-4">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0c0-4 3-7 7-9" />
                </svg>
                <p className="text-sm font-medium text-leaf-900">
                  Jouw hortensia staat er goed bij — geef hem elke ochtend een glas water extra bij warm weer.
                </p>
              </div>
            </div>
          </div>

          {/* Water week mock */}
          <div className="border-t border-stone-100 p-6">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Watergeefadvies komende 7 dagen</p>
            <div className="grid grid-cols-7 gap-2">
              {[
                { dag: "Ma", level: 1, label: "geen" },
                { dag: "Di", level: 2, label: "licht" },
                { dag: "Wo", level: 3, label: "extra" },
                { dag: "Do", level: 3, label: "extra" },
                { dag: "Vr", level: 2, label: "licht" },
                { dag: "Za", level: 1, label: "geen" },
                { dag: "Zo", level: 1, label: "geen" },
              ].map(({ dag, level, label }) => {
                const colors = level === 3
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : level === 2
                  ? "bg-sky-50 border-sky-100 text-sky-900"
                  : "bg-leaf-50 border-leaf-100 text-leaf-800";
                const dropColor = level === 3 ? "text-amber-500" : level === 2 ? "text-sky-500" : "text-leaf-500";
                const dimColor = level === 3 ? "text-amber-200" : level === 2 ? "text-sky-200" : "text-leaf-200";
                return (
                  <div key={dag} className={`rounded-xl border p-2.5 ${colors}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide">{dag}</p>
                    <div className="mt-1.5 flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <svg key={i} className={`h-3 w-3 ${i < level ? dropColor : dimColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C9 7 6 10.4 6 14a6 6 0 0 0 12 0c0-3.6-3-7-6-11Zm0 17a4 4 0 0 1-4-4" />
                        </svg>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[9px] font-semibold">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plant mock */}
          <div className="border-t border-stone-100 p-6">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Jouw planten</p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "Hortensia", zekerheid: "hoog", actie: "Geef dagelijks water bij temperaturen boven 22°C.", snoei: "Wacht tot na de bloei in september.", water: "Houd de grond vochtig maar niet drassig." },
                { name: "Lavendel", zekerheid: "hoog", actie: "Knip lichtjes terug na de eerste bloei om nieuwe knoppen te stimuleren.", snoei: "Licht snoeien bevordert compacte groei.", water: "Droogteresistent — 1× per week is voldoende." },
                { name: "Klimop", zekerheid: "middel", actie: "Controleer nieuwe uitlopers langs muren en stuur bij waar nodig.", snoei: "Houd randen en vensterbanken vrij.", water: "Weinig water nodig bij normaal weer." },
              ].map((p) => (
                <div key={p.name} className="overflow-hidden rounded-xl border border-stone-100">
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-base text-leaf-900">{p.name}</p>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${p.zekerheid === "hoog" ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        <span className={`h-1 w-1 rounded-full ${p.zekerheid === "hoog" ? "bg-leaf-500" : "bg-amber-400"}`} />
                        {p.zekerheid === "hoog" ? "Hoge zekerheid" : "Middelmatige zekerheid"}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-1.5 border-t border-stone-50 px-4 py-3">
                    <div className="flex gap-2 text-xs"><span className="w-10 shrink-0 font-semibold text-stone-400">Water</span><span className="text-stone-600">{p.water}</span></div>
                    <div className="flex gap-2 text-xs"><span className="w-10 shrink-0 font-semibold text-stone-400">Snoei</span><span className="text-stone-600">{p.snoei}</span></div>
                  </div>
                  <div className="border-t border-leaf-50 bg-leaf-50/60 px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-leaf-600">Nu doen</p>
                    <p className="mt-0.5 text-xs font-medium leading-5 text-leaf-900">{p.actie}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA of mock */}
          <div className="border-t border-stone-100 bg-[#f3f4ee] px-6 py-5 text-center">
            <p className="text-sm text-stone-500">Dit is een voorbeeldrapport. Jouw rapport is afgestemd op jouw adres, planten en het actuele weer.</p>
            <Link href="/app"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-leaf-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf-800">
              Maak mijn eigen rapport
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────── */

function Features() {
  const items = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0c0-4 3-7 7-9" />
        </svg>
      ),
      title: "Plantherkenning via Pl@ntNet",
      text: "Pl@ntNet geeft plantsuggesties op basis van je close-upfoto's. Jij bevestigt de naam.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.4-6.4 1.4-1.4M4.2 19.8l1.4-1.4m0-12.8L4.2 4.2m15.6 15.6-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
      ),
      title: "Lokale weerdata van 7 dagen",
      text: "Via Open-Meteo laden we weerdata voor jouw exacte locatie — zo is wateradvies altijd actueel.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C9 7 6 10.4 6 14a6 6 0 0 0 12 0c0-3.6-3-7-6-11Zm0 17a4 4 0 0 1-4-4" />
        </svg>
      ),
      title: "Watergeefadvies per dag",
      text: "Voor elke dag van de komende week krijg je concreet advies: geen water, licht water of extra water geven.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      title: "Adresgebaseerd via PDOK",
      text: "We koppelen je adres aan officiële geodata om standplaats, omgeving en perceeltype te bepalen.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
      title: "Persoonlijk tuinprofiel",
      text: "Je rapport bevat een profiel van jouw tuin: ligging, biodiversiteit, droogterisico en seizoensadvies.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      title: "Geen account of login",
      text: "Vul in, bevestig je planten en ontvang advies. Je gegevens worden niet opgeslagen.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay">Wat je krijgt</p>
          <h2 className="font-serif mt-3 text-[2rem] text-[#1f2a1a] md:text-[2.6rem]">Alles wat jouw tuin nodig heeft</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-2xl bg-[#f3f4ee] p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-leaf-700">{item.icon}</span>
              <h3 className="mt-4 font-semibold text-leaf-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-500">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ────────────────────────────────────────── */

function BottomCTA() {
  return (
    <section className="relative overflow-hidden bg-[#141c12] py-24 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0 select-none opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="relative mx-auto max-w-2xl px-5 text-center md:px-8">
        <h2 className="font-serif text-[2.2rem] leading-tight text-white md:text-[3rem]">
          Klaar voor jouw persoonlijk tuinadvies?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.8] text-white/45">
          Gratis, zonder account, direct resultaat. Vul je tuinprofiel in en ontvang persoonlijk advies binnen een minuut.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/app"
            className="inline-flex items-center gap-2.5 rounded-xl bg-clay px-7 py-4 text-[15px] font-semibold text-white shadow-lg transition hover:bg-[#a04e25] hover:shadow-xl active:scale-[0.98]">
            Start gratis analyse
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <span className="text-sm text-white/30">Geen account · Geen opslag · Direct klaar</span>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#141c12] px-5 py-10 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <span className="font-serif text-lg text-white/70">TuinRadar</span>
        <p className="text-[12px] text-white/25">
          Gratis demo · Pl@ntNet plantherkenning · Open-Meteo weerdata · PDOK geodata · Geen database of login
        </p>
        <Link href="/app" className="text-[12px] font-semibold text-white/40 transition hover:text-white/70">
          Start analyse →
        </Link>
      </div>
    </footer>
  );
}
