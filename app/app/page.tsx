"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { AnalyzeResponse, PlantIdentification } from "../types";

const gardenTypes = ["Compacte stadstuin", "Groene familietuin", "Onderhoudsarme tuin", "Moderne/design tuin", "Mediterrane sfeer", "Natuurlijke/biodiverse tuin"];
const sunProfiles = ["Vooral ochtendzon", "Vooral middagzon", "Veel schaduw", "Gemengd"];
const greenLevels = ["Veel bestrating", "Gemengd", "Vooral groen"];
const goals = ["Meer kleur", "Minder onderhoud", "Meer biodiversiteit", "Gezondere planten", "Mediterrane uitstraling", "Strakkere uitstraling"];
const maintenanceLevels = ["laag", "gemiddeld", "hoog"];
const uncertainPlantLabel = "Nog niet zeker herkend";
const plantOptions = ["Hortensia", "Lavendel", "Beukenhaag", "Olifantsoor", "Siergras", "Klimop", "Roos", "Buxus", "Geranium", uncertainPlantLabel];

type PlantChoice = { plant: string; customName: string; score?: number; };
type AddressSuggestion = { id: string; label: string; };
type ApiReadResult<T> = { data: T | null; message: string };

function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (!raw) return "Er is iets misgegaan. Probeer het opnieuw.";
  if (/http|api|\b[45]\d{2}\b|error|exception|fetch|network|timeout|deploy|deployment|html|token|json|stack/i.test(raw) || raw.length > 140) {
    return "De analyse kon niet worden voltooid. Controleer je verbinding en probeer opnieuw.";
  }
  return raw;
}

function sanitizeMessage(msg: string): string {
  if (!msg) return "";
  if (/http|api|\b[45]\d{2}\b|error|exception|plantnet|pl@ntnet api|deploy|deployment|html|token|json|fetch|network|stack/i.test(msg)) {
    return "Plant kon niet zeker worden herkend. Kies de naam eventueel handmatig.";
  }
  return msg;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<ApiReadResult<T>> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    await response.text().catch(() => "");
    return { data: null, message: fallbackMessage };
  }

  try {
    const data = await response.json();
    const message = typeof data?.error === "string"
      ? sanitizeUserFacingError(data.error, fallbackMessage)
      : typeof data?.melding === "string"
        ? sanitizeUserFacingError(data.melding, "")
        : "";
    return { data: data as T, message };
  } catch {
    return { data: null, message: fallbackMessage };
  }
}

function sanitizeUserFacingError(message: string, fallbackMessage: string) {
  if (!message) return fallbackMessage;
  if (/http|api|\b[45]\d{2}\b|error|exception|fetch|network|timeout|deploy|deployment|html|token|json|stack/i.test(message) || message.length > 140) {
    return fallbackMessage;
  }
  return message;
}

const ANALYSE_STEPS = [
  "Locatie controleren",
  "Weersverwachting ophalen",
  "Planten herkennen",
  "Droogterisico berekenen",
  "Persoonlijk tuinadvies samenstellen",
];

/* ─────────────────────────────────────────────── */

export default function AppPage() {
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [gardenType, setGardenType] = useState(gardenTypes[0]);
  const [sunProfile, setSunProfile] = useState(sunProfiles[3]);
  const [greenLevel, setGreenLevel] = useState(greenLevels[1]);
  const [goal, setGoal] = useState(goals[2]);
  const [maintenance, setMaintenance] = useState(maintenanceLevels[1]);
  const [plantPhotos, setPlantPhotos] = useState<File[]>([]);
  const [plantChoices, setPlantChoices] = useState<PlantChoice[]>([]);
  const [plantIdentifications, setPlantIdentifications] = useState<PlantIdentification[]>([]);
  const [identificationMessage, setIdentificationMessage] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const plantPreviews = useMemo(() => plantPhotos.map((f) => URL.createObjectURL(f)), [plantPhotos]);
  useEffect(() => () => { plantPreviews.forEach((u) => URL.revokeObjectURL(u)); }, [plantPreviews]);

  const canSubmit = useMemo(
    () =>
      street.trim().length > 1 && houseNumber.trim().length > 0 &&
      postcode.trim().length > 5 && city.trim().length > 1 &&
      plantPhotos.length >= 4 && plantPhotos.length <= 7 &&
      plantChoices.length === plantPhotos.length,
    [city, houseNumber, plantChoices.length, plantPhotos.length, postcode, street]
  );

  useEffect(() => {
    const query = `${street} ${houseNumber} ${postcode} ${city}`.trim();
    if (query.length < 3) { setAddressSuggestions([]); return; }
    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`);
        const { data } = await readJsonResponse<{ suggesties?: AddressSuggestion[] }>(res, "");
        setAddressSuggestions(Array.isArray(data?.suggesties) ? data.suggesties : []);
      } catch { setAddressSuggestions([]); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [city, houseNumber, postcode, street]);

  function applyAddressSuggestion(label: string) {
    const match = label.match(/^(.+?)\s+([\w\-]+),\s*([1-9][0-9]{3}\s?[A-Z]{2})\s+(.+)$/i);
    if (match) { setStreet(match[1]); setHouseNumber(match[2]); setPostcode(match[3].toUpperCase()); setCity(match[4]); }
    setAddressSuggestions([]);
  }

  async function handlePlantPhotos(files: File[]) {
    setPlantPhotos(files);
    setPlantIdentifications([]);
    setIdentificationMessage("");
    setResult(null);
    setPlantChoices((cur) => files.map((_, i) => cur[i] || { plant: uncertainPlantLabel, customName: "" }));
    if (!files.length) return;
    setIsIdentifying(true);
    try {
      const fd = new FormData();
      files.slice(0, 7).forEach((f) => fd.append("plantPhotos", f));
      const res = await fetch("/api/identify-plants", { method: "POST", body: fd });
      const { data, message } = await readJsonResponse<{ resultaten?: PlantIdentification[]; melding?: string }>(
        res,
        "Automatische herkenning is tijdelijk niet beschikbaar. Kies de plantnaam zelf."
      );
      if (!res.ok || !data) {
        setIdentificationMessage(message || "Automatische herkenning is tijdelijk niet beschikbaar. Kies de plantnaam zelf.");
        return;
      }
      const resultaten = Array.isArray(data.resultaten) ? data.resultaten : [];
      setPlantIdentifications(resultaten);
      const rawMsg = message || data.melding || "";
      setIdentificationMessage(
        sanitizeMessage(rawMsg) ||
        (resultaten.length ? "Herkenning geslaagd — controleer of de naam klopt." : "Geen zekere herkenning. Kies handmatig.")
      );
      setPlantChoices((cur) => files.map((_, i) => {
        const s = resultaten.find((r) => r.fotoIndex === i)?.suggesties[0];
        return s ? { plant: s.naam, customName: "", score: s.score } : cur[i] || { plant: uncertainPlantLabel, customName: "" };
      }));
    } catch { setIdentificationMessage("Plant kon niet worden herkend. Kies de naam handmatig."); }
    finally { setIsIdentifying(false); }
  }

  function updatePlantChoice(index: number, choice: Partial<PlantChoice>) {
    setPlantChoices((cur) => cur.map((item, i) => i === index ? { ...item, ...choice } : item));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true); setError(""); setResult(null);
    const fd = new FormData();
    fd.set("street", street); fd.set("houseNumber", houseNumber);
    fd.set("postcode", postcode); fd.set("city", city);
    fd.set("goal", goal); fd.set("maintenance", maintenance);
    fd.set("gardenType", gardenType);
    fd.set("sunProfile", sunProfile);
    fd.set("greenLevel", greenLevel);
    fd.set("plantSelections", JSON.stringify(plantChoices.map((c, i) => ({ index: i, plant: c.plant, customName: c.customName, score: c.score }))));
    plantPhotos.forEach((f) => fd.append("plantPhotos", f));
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const { data, message } = await readJsonResponse<AnalyzeResponse>(
        res,
        "Je tuinadvies kon niet worden samengesteld. Probeer het later opnieuw."
      );
      if (!res.ok || !data) throw new Error(message || "Je tuinadvies kon niet worden samengesteld. Probeer het later opnieuw.");
      setResult(data);
    } catch (err) { setError(sanitizeError(err)); }
    finally { setIsLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#f3f4ee] text-[#1f2a1a]">

      {/* ── App nav ─────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/60 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2 text-leaf-900 transition hover:opacity-70">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm font-medium">Terug naar overzicht</span>
          </Link>
          <span className="font-serif text-lg text-leaf-900">TuinRadar</span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Gratis demo
          </span>
        </div>
      </nav>

      {/* ── Intake section ──────────────────────── */}
      <section className="relative overflow-hidden bg-[#141c12] pb-14 pt-10 text-white md:pb-20 md:pt-14">
        <div className="pointer-events-none absolute inset-0 select-none opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-2/5 select-none overflow-hidden opacity-[0.04]">
          <svg viewBox="0 0 260 500" fill="white" className="h-full w-full translate-x-1/4" aria-hidden="true">
            <path d="M130 6 C65 72 10 155 10 255 C10 355 70 440 130 468 C190 440 250 355 250 255 C250 155 195 72 130 6Z" />
            <path d="M130 80 C100 135 72 195 72 255 C72 315 100 365 130 390" stroke="white" strokeWidth="1.5" fill="none" />
            <ellipse cx="98" cy="195" rx="38" ry="10" transform="rotate(-32 98 195)" />
            <ellipse cx="162" cy="228" rx="38" ry="10" transform="rotate(32 162 228)" />
            <ellipse cx="90" cy="285" rx="33" ry="9" transform="rotate(-26 90 285)" />
            <ellipse cx="168" cy="318" rx="33" ry="9" transform="rotate(26 168 318)" />
          </svg>
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1fr_1fr] md:items-start md:px-8">
          <div className="flex flex-col gap-6 pt-1 md:py-4">
            <div>
              <h1 className="font-serif text-[2.2rem] leading-[1.12] tracking-tight text-white md:text-[2.8rem]">
                Jouw digitale tuincoach voor deze maand
              </h1>
              <p className="mt-4 max-w-sm text-[14px] leading-[1.85] text-white/45">
                Vul je adres en tuinprofiel in, voeg close-ups van je planten toe en krijg persoonlijk seizoensadvies voor jouw tuin.
              </p>
            </div>
            <div className="grid gap-2">
              {[
                { icon: "leaf" as IconName,   text: "Planten automatisch herkend via Pl@ntNet" },
                { icon: "sun"  as IconName,   text: "Lokale weerdata van de komende 7 dagen" },
                { icon: "water" as IconName,  text: "Watergeefadvies per dag op maat" },
                { icon: "flower" as IconName, text: "Geen account of login vereist" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.07]">
                    <Icon name={icon} className="h-3.5 w-3.5 text-white/40" />
                  </span>
                  <span className="text-[13px] text-white/40">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-[0_12px_48px_rgba(0,0,0,0.22)] md:p-7">
            <FormSection step="1" title="Jouw adres">
              <div className="grid gap-3 sm:grid-cols-[1fr_0.42fr]">
                <FormInput value={street} onChange={setStreet} placeholder="Straatnaam" />
                <FormInput value={houseNumber} onChange={setHouseNumber} placeholder="Nr." />
              </div>
              <div className="grid gap-3 sm:grid-cols-[0.52fr_1fr]">
                <FormInput value={postcode} onChange={setPostcode} placeholder="Postcode" className="uppercase" />
                <FormInput value={city} onChange={setCity} placeholder="Plaats" />
              </div>
              {addressSuggestions.length ? (
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                  <div className="border-b border-stone-100 px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Suggesties</span>
                  </div>
                  {addressSuggestions.map((s) => (
                    <button key={s.id} type="button" onClick={() => applyAddressSuggestion(s.label)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 transition hover:bg-leaf-50 hover:text-leaf-900">
                      <Icon name="leaf" className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </FormSection>

            <FormSection step="2" title="Jouw tuinprofiel">
              <label className="grid gap-1.5">
                <span className={labelClass}>Welke omschrijving past het best bij jouw tuin?</span>
                <select value={gardenType} onChange={(e) => setGardenType(e.target.value)} className={selectClass}>
                  {gardenTypes.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className={labelClass}>Hoeveel zon krijgt je tuin gemiddeld?</span>
                  <select value={sunProfile} onChange={(e) => setSunProfile(e.target.value)} className={selectClass}>
                    {sunProfiles.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClass}>Hoe groen is je tuin?</span>
                  <select value={greenLevel} onChange={(e) => setGreenLevel(e.target.value)} className={selectClass}>
                    {greenLevels.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className={labelClass}>Wat wil je vooral verbeteren?</span>
                  <select value={goal} onChange={(e) => setGoal(e.target.value)} className={selectClass}>
                    {goals.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className={labelClass}>Onderhoud</span>
                  <select value={maintenance} onChange={(e) => setMaintenance(e.target.value)} className={selectClass}>
                    {maintenanceLevels.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>
              </div>
            </FormSection>

            <FormSection step="3" title="Plantfoto's uploaden">
              <FileInput label="Close-ups per plant" hint="4 tot 7 foto's van afzonderlijke planten" min={4} max={7} files={plantPhotos} onFiles={handlePlantPhotos} />
            </FormSection>

            {plantPhotos.length ? (
              <div className="mt-1 border-t border-stone-100 pt-5">
                <PlantChoices choices={plantChoices} identifications={plantIdentifications}
                  isIdentifying={isIdentifying} message={identificationMessage}
                  previews={plantPreviews} onChange={updatePlantChoice} />
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            ) : null}

            <button disabled={!canSubmit || isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-clay px-5 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#a04e25] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none">
              {isLoading ? (
                <><Icon name="spinner" className="h-4 w-4 animate-spin-slow" />Advies samenstellen...</>
              ) : (
                <><Icon name="leaf" className="h-4 w-4" />Maak tuinadvies</>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── Report / loader / empty ──────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        {isLoading ? <AnalyseLoader /> : result ? <GardenReport result={result} /> : <EmptyState />}
      </section>
    </div>
  );
}

/* ── Analyse loading ────────────────────────────────────── */

function AnalyseLoader() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const delays = [500, 1500, 2800, 4200, 5800];
    const timers = delays.map((d, i) => window.setTimeout(() => setCount(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-8 rounded-2xl bg-white px-8 py-16 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-leaf-50">
          <Icon name="leaf" className="h-7 w-7 animate-spin-slow text-leaf-700" />
        </div>
        <h3 className="font-serif text-2xl text-leaf-900">Persoonlijk tuinadvies samenstellen</h3>
        <p className="text-sm text-stone-400">Even geduld — we verwerken je gegevens</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        {ANALYSE_STEPS.map((step, i) => {
          const visible = i < count;
          const current = i === count - 1;
          return (
            <div key={step} className={`flex items-center gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors duration-300 ${current ? "bg-clay/10 ring-2 ring-clay/30" : visible ? "bg-leaf-700" : "border-2 border-stone-200"}`}>
                {visible && !current && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {current && <span className="h-2 w-2 rounded-full bg-clay animate-shimmer" />}
              </span>
              <span className={`text-sm ${current ? "font-semibold text-leaf-900" : visible ? "text-stone-400" : "text-stone-300"}`}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-leaf-50">
        <svg className="h-8 w-8 text-leaf-700 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-leaf-900">Jouw rapport verschijnt hier</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-stone-500">
          Vul het formulier in en klik op <em>Maak tuinadvies</em> — jouw persoonlijk tuinrapport verschijnt hier.
        </p>
      </div>
    </div>
  );
}

/* ── Garden Report ──────────────────────────────────────── */

function GardenReport({ result }: { result: AnalyzeResponse }) {
  const monthLabel = new Date().toLocaleDateString("nl-NL", { month: "long", year: "numeric" });

  return (
    <div className="animate-fade-up grid gap-8">

      {result.demo?.tuinDna?.length ? (
        <section className="overflow-hidden rounded-3xl bg-[#141c12] p-6 text-white shadow-[0_16px_48px_rgba(20,28,18,0.22)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[0.75fr_1.25fr] md:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Jouw Tuin-DNA</p>
              <h3 className="font-serif mt-2 text-3xl leading-tight text-white">Zo voelt je tuin deze maand</h3>
              <p className="mt-3 text-sm leading-7 text-white/45">{result.tuinprofiel.samenvatting}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {result.demo.tuinDna.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.08]">
                    <Icon name="leaf" className="h-4 w-4 text-white/50" />
                  </span>
                  <span className="text-sm font-medium leading-6 text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Report header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay">Persoonlijk tuinrapport</p>
        <h2 className="font-serif mt-2 text-[2rem] leading-tight text-leaf-900">
          {result.locatie?.adres || "Jouw tuin"}
        </h2>
        <p className="mt-1 text-sm text-stone-400">{monthLabel} · persoonlijk seizoensadvies</p>
      </div>

      {/* ── 1. Jouw tuin in één oogopslag ── */}
      <ReportSection label="Jouw tuin in één oogopslag">
        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e8ede4" strokeWidth="7" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#3d6020" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray={`${((result.tuinscore || 72) / 100) * 263.9} 263.9`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold text-leaf-900">{result.tuinscore || 72}</span>
                <span className="text-[10px] font-medium text-stone-400">tuinscore</span>
              </div>
            </div>
            {result.demo?.tuinscoreTrend && (
              <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                result.demo.tuinscoreTrend.richting === "stijgend" ? "bg-leaf-50 text-leaf-700" :
                result.demo.tuinscoreTrend.richting === "dalend" ? "bg-red-50 text-red-700" :
                "bg-stone-100 text-stone-600"
              }`}>{result.demo.tuinscoreTrend.richting}</span>
            )}
          </div>

          {/* Samenvatting */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-serif text-xl text-leaf-900">{result.tuinprofiel.samenvatting}</h3>
              <p className="mt-2 leading-7 text-stone-600">
                {result.demo?.tuinscoreTrend.tekst || result.tuinprofiel.zon_schaduw}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f3f4ee] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Jouw tuinprofiel</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ProfilePill label="Ligging" value={result.tuinprofiel.ligging_inschatting} />
                <ProfilePill label="Risico" value={result.tuinprofiel.risico} />
                {result.demo?.liggingInschatting && <ProfilePill label="Standplaats" value={result.demo.liggingInschatting} />}
                {result.demo?.biodiversiteitScore && <ProfilePill label="Biodiversiteit" value={`${result.demo.biodiversiteitScore.score}/100`} />}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
              <Icon name="leaf" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" />
              <p className="text-sm font-medium leading-6 text-leaf-900">{result.wow_samenvatting}</p>
            </div>
          </div>
        </div>
      </ReportSection>

      {/* ── 2. Deze maand in jouw tuin ── */}
      <ReportSection label="Deze maand in jouw tuin">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Maandadvies</p>
            <p className="mt-3 leading-7 text-stone-700">{result.maandadvies}</p>
          </div>
          {result.demo && (
            <div className="grid gap-3">
              <SmallCard icon="sun" label="Tuinweer" value={result.demo.tuinweer.titel} text={result.demo.tuinweer.tekst} />
              <SmallCard icon="flower" label="Plant van de maand" value={result.demo.plantVanDeMaand.naam} text={result.demo.plantVanDeMaand.actie} />
              {result.demo.binnenkortInBloei.length > 0 && (
                <SmallCard icon="flower" label="Binnenkort in bloei" value={result.demo.binnenkortInBloei.join(", ")} text="Verwacht binnen 8 weken." />
              )}
            </div>
          )}
        </div>

        {/* Prioriteiten */}
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Aandachtspunten</p>
          <ol className="grid gap-2 md:grid-cols-3">
            {result.prioriteiten.slice(0, 3).map((item, i) => (
              <li key={item} className="flex gap-3 rounded-xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-900 text-[11px] font-bold text-white">{i + 1}</span>
                <span className="text-sm leading-6 text-stone-700">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </ReportSection>

      {/* ── 3. Water & droogte ── */}
      <ReportSection label="Water & droogte">
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <p className="font-medium text-leaf-900">{result.weeradvies.samenvatting}</p>
            <p className="mt-3 text-sm leading-6 text-stone-500">{result.weeradvies.wateradvies_7_dagen}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" />
              <p className="text-sm font-semibold text-clay">Droogterisico: {result.weeradvies.droogte_risico}</p>
            </div>
            {result.demo?.droogtestress && (
              <div className="mt-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <p className="text-sm text-stone-600">Droogtestress: <span className="font-medium">{result.demo.droogtestress.niveau}</span> — {result.demo.droogtestress.uitleg}</p>
              </div>
            )}
          </div>
          {result.demo && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Waterbehoefte</p>
              <p className="mt-2 text-lg font-semibold text-leaf-900">{result.demo.waterdrukte.niveau}</p>
              <p className="mt-1 text-sm leading-6 text-stone-500">{result.demo.waterdrukte.tekst}</p>
            </div>
          )}
        </div>

        {result.demo?.waterPerDag && (
          <div className="mt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Watergeefadvies komende 7 dagen</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:mx-0 md:grid md:grid-cols-7 md:gap-3 md:overflow-visible md:pb-0">
              {result.demo.waterPerDag.map((day) => <WaterDayCard key={day.datum} day={day} />)}
            </div>
          </div>
        )}
      </ReportSection>

      {/* ── 4. Jouw planten ── */}
      <ReportSection label="Jouw planten">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.planten.map((plant, i) => <PlantArticle key={plant.foto} plant={plant} index={i} />)}
        </div>
      </ReportSection>

      {/* ── 5. Omgeving ── */}
      {result.demo?.omgeving && (
        <ReportSection label="Jouw omgeving">
          <EnvironmentBlock omgeving={result.demo.omgeving} />
        </ReportSection>
      )}

      {/* ── CTA ── */}
      <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Tips voor volgende keer</p>
        <div className="grid gap-5 sm:grid-cols-3">
          <CTAItem icon="leaf" title="Herhaal over 2 weken" text="Seizoensadvies verandert snel. Een nieuwe analyse geeft bijgewerkte inzichten." />
          <CTAItem icon="water" title="Let op bij droogte" text="Controleer potplanten dagelijks bij langdurige hitte of droge periodes." />
          <CTAItem icon="flower" title="Meer foto's = beter advies" text="Voeg close-ups toe van planten die je nog niet goed herkent." />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3.5">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-sm leading-6 text-amber-900">
          Advies gebaseerd op plantkeuze, seizoen en actuele weerdata voor jouw locatie. Controleer bij twijfel altijd een tweede bron.
        </p>
      </div>

    </div>
  );
}

/* ── Report building blocks ─────────────────────────────── */

function ReportSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-stone-200" />
        <h3 className="font-serif text-lg text-leaf-900">{label}</h3>
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      {children}
    </section>
  );
}

function ProfilePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-leaf-900">{value}</p>
    </div>
  );
}

function SmallCard({ icon, label, value, text }: { icon: IconName; label: string; value: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-leaf-50">
        <Icon name={icon} className="h-3.5 w-3.5 text-leaf-700" />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-sm font-semibold text-leaf-900">{value}</p>
        <p className="mt-0.5 text-xs leading-5 text-stone-500">{text}</p>
      </div>
    </div>
  );
}

function EnvironmentBlock({ omgeving }: { omgeving: NonNullable<AnalyzeResponse["demo"]>["omgeving"] }) {
  return (
    <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:grid-cols-[auto_1fr]">
      {omgeving.kaartUrl ? (
        <div className="overflow-hidden rounded-xl border border-stone-100">
          <img src={omgeving.kaartUrl} alt="Kaartlocatie" className="h-40 w-full object-cover sm:w-52" />
        </div>
      ) : (
        <div className="grid h-40 w-full place-items-center rounded-xl bg-stone-50 text-sm text-stone-400 sm:w-52">Geen kaart</div>
      )}
      <div>
        <h4 className="font-serif text-lg text-leaf-900">{omgeving.type}</h4>
        <p className="mt-2 text-sm leading-6 text-stone-600">{omgeving.perceelgevoel}</p>
        <p className="mt-1.5 text-sm leading-6 text-stone-600">{omgeving.nabijheid}</p>
      </div>
    </div>
  );
}

function CTAItem({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-leaf-50">
        <Icon name={icon} className="h-3.5 w-3.5 text-leaf-700" />
      </span>
      <div>
        <p className="text-sm font-semibold text-leaf-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-stone-500">{text}</p>
      </div>
    </div>
  );
}

function WaterDayCard({ day }: { day: NonNullable<AnalyzeResponse["demo"]>["waterPerDag"][number] }) {
  const config = {
    "geen water nodig":  { bg: "bg-leaf-50",  border: "border-leaf-100",  text: "text-leaf-800",  drops: 1, dropColor: "text-leaf-500",  dimColor: "text-leaf-200" },
    "licht water geven": { bg: "bg-sky-50",    border: "border-sky-100",   text: "text-sky-900",   drops: 2, dropColor: "text-sky-500",   dimColor: "text-sky-200" },
    "extra water geven": { bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-900", drops: 3, dropColor: "text-amber-500", dimColor: "text-amber-200" },
  }[day.advies] ?? { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700", drops: 1, dropColor: "text-stone-400", dimColor: "text-stone-200" };
  return (
    <div className={`min-w-[96px] shrink-0 rounded-xl border p-3 md:min-w-0 ${config.bg} ${config.border}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${config.text}`}>{day.datum}</p>
      <div className="mt-2 flex gap-0.5">
        {[0, 1, 2].map((i) => <Icon key={i} name="water" className={`h-3.5 w-3.5 ${i < config.drops ? config.dropColor : config.dimColor}`} />)}
      </div>
      <p className={`mt-2 text-[11px] font-semibold leading-tight ${config.text}`}>{day.advies}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-[1.4] text-stone-500">{day.reden}</p>
    </div>
  );
}

/* ── Plant cards (3 variants) ───────────────────────────── */

function PlantArticle({ plant, index }: { plant: AnalyzeResponse["planten"][number]; index: number }) {
  const v = index % 3;
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">{plant.foto}</p>
            <h3 className="mt-0.5 font-serif text-xl text-leaf-900">{plant.waarschijnlijke_plant}</h3>
          </div>
          <ConfidenceBadge value={plant.zekerheid} />
        </div>
      </div>
      {v === 0 && <PlantBodyStandard plant={plant} />}
      {v === 1 && <PlantBodyObservation plant={plant} />}
      {v === 2 && <PlantBodyActionFirst plant={plant} />}
      {plant.zekerheid !== "hoog" && (
        <div className="border-t border-amber-50 bg-amber-50/60 px-5 py-2.5">
          <p className="text-xs font-medium text-amber-700">Controleer de plantnaam voor specifieker advies.</p>
        </div>
      )}
    </article>
  );
}

function PlantBodyStandard({ plant }: { plant: AnalyzeResponse["planten"][number] }) {
  return (
    <>
      <div className="border-t border-stone-50 px-5 pb-1 pt-3">
        <p className="text-sm leading-6 text-stone-600">{plant.gezondheid}</p>
      </div>
      <div className="grid gap-2 px-5 py-4">
        <AdviceLine icon="water" label="Water" value={plant.water} />
        <AdviceLine icon="leaf" label="Snoei" value={plant.snoei} />
        <AdviceLine icon="flower" label="Deze maand" value={plant.actie_deze_maand} />
      </div>
      {plant.opmerking && <div className="border-t border-stone-50 px-5 py-3"><p className="text-xs leading-5 text-stone-400">{plant.opmerking}</p></div>}
    </>
  );
}

function PlantBodyObservation({ plant }: { plant: AnalyzeResponse["planten"][number] }) {
  return (
    <>
      <div className="border-t border-stone-50 px-5 py-4">
        <p className="text-sm leading-6 text-stone-700">{plant.gezondheid}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <InlineTag icon="water" text={plant.water} />
          <InlineTag icon="leaf" text={plant.snoei} />
        </div>
      </div>
      <div className="border-t border-leaf-50 bg-leaf-50/60 px-5 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-leaf-600">Aandacht deze maand</p>
        <p className="mt-1 text-sm font-medium leading-6 text-leaf-900">{plant.actie_deze_maand}</p>
      </div>
      {plant.opmerking && <div className="border-t border-stone-50 px-5 py-3"><p className="text-xs leading-5 text-stone-400">{plant.opmerking}</p></div>}
    </>
  );
}

function PlantBodyActionFirst({ plant }: { plant: AnalyzeResponse["planten"][number] }) {
  return (
    <>
      <div className="border-t border-stone-50 bg-stone-50/40 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Wat nu te doen</p>
        <p className="mt-1.5 text-sm font-semibold leading-6 text-leaf-900">{plant.actie_deze_maand}</p>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm leading-6 text-stone-600">{plant.gezondheid}</p>
        <div className="mt-3 grid gap-1.5">
          <CompactLine label="Water" value={plant.water} />
          <CompactLine label="Snoei" value={plant.snoei} />
        </div>
      </div>
      {plant.opmerking && <div className="border-t border-stone-50 px-5 py-3"><p className="text-xs leading-5 text-stone-400">{plant.opmerking}</p></div>}
    </>
  );
}

function InlineTag({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-100 bg-white px-2.5 py-1.5 text-xs text-stone-600 shadow-sm">
      <Icon name={icon} className="h-3 w-3 shrink-0 text-stone-400" />
      <span className="line-clamp-1">{text}</span>
    </span>
  );
}

function CompactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-10 shrink-0 font-semibold text-stone-400">{label}</span>
      <span className="leading-6 text-stone-600">{value}</span>
    </div>
  );
}

/* ── Plant choices (form) ───────────────────────────────── */

function PlantChoices({ choices, identifications, isIdentifying, message, previews, onChange }: {
  choices: PlantChoice[]; identifications: PlantIdentification[]; isIdentifying: boolean;
  message: string; previews: string[]; onChange: (i: number, c: Partial<PlantChoice>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <span className="text-sm font-semibold text-[#1f2a1a]">Klopt de naam voor elke plant?</span>
        <div className={`mt-2 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${isIdentifying ? "bg-sky-50" : "bg-leaf-50"}`}>
          {isIdentifying ? (
            <><Icon name="spinner" className="h-4 w-4 shrink-0 animate-spin-slow text-sky-500" />
              <p className="text-sm font-medium text-sky-800">Pl@ntNet herkent je planten…</p></>
          ) : (
            <><Icon name="leaf" className="h-4 w-4 shrink-0 text-leaf-600" />
              <p className="text-sm font-medium text-leaf-900">{message || "Controleer of de voorgestelde naam bij jouw plant past."}</p></>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice, index) => (
          <div key={`${previews[index]}-${index}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <img src={previews[index]} alt={`Plantfoto ${index + 1}`} className="h-36 w-full object-cover" />
            <div className="p-3.5">
              <PlantSuggestions identification={identifications.find((item) => item.fotoIndex === index)} />
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Welke plant is dit?</span>
                <select value={choice.plant}
                  onChange={(e) => onChange(index, { plant: e.target.value, score: getSuggestionScore(identifications.find((item) => item.fotoIndex === index), e.target.value) })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-[#1f2a1a] outline-none transition focus:border-leaf-400 focus:bg-white focus:ring-2 focus:ring-leaf-100">
                  {getChoiceOptions(identifications.find((item) => item.fotoIndex === index)).map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              {choice.plant === uncertainPlantLabel && (
                <label className="mt-2.5 block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-stone-400">Anders, namelijk</span>
                  <input value={choice.customName} onChange={(e) => onChange(index, { customName: e.target.value })}
                    placeholder="Bijv. Japanse esdoorn"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition focus:border-leaf-400 focus:bg-white focus:ring-2 focus:ring-leaf-100 placeholder:text-stone-400" />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlantSuggestions({ identification }: { identification?: PlantIdentification }) {
  if (!identification) return <p className="text-xs text-stone-400">Nog geen suggesties beschikbaar.</p>;
  const foutmelding = identification.foutmelding ? sanitizeMessage(identification.foutmelding) : "";
  if (foutmelding && !identification.suggesties.length) return <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">{foutmelding}</p>;
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Pl@ntNet suggesties</span>
      {identification.suggesties.map((s) => (
        <div key={`${s.naam}-${s.score}`} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 text-xs">
          <span>
            <span className="font-semibold text-leaf-900">{s.naam}</span>
            {s.wetenschappelijkeNaam && <span className="block italic text-stone-400">{s.wetenschappelijkeNaam}</span>}
          </span>
          <SuggestionBadge score={s.score} />
        </div>
      ))}
      {foutmelding && <p className="text-[11px] text-stone-500">{foutmelding}</p>}
    </div>
  );
}

function SuggestionBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const { label, cls } = score >= 0.55 ? { label: "Hoge zekerheid", cls: "bg-leaf-100 text-leaf-700" }
    : score >= 0.25 ? { label: "Middelmatige zekerheid", cls: "bg-amber-50 text-amber-700" }
    : { label: "Lage zekerheid", cls: "bg-red-50 text-red-700" };
  return (
    <span className={`inline-flex shrink-0 flex-col items-center rounded-lg px-2 py-1 font-semibold ${cls}`}>
      <span className="text-[10px]">{label}</span>
      <span className="text-[9px] opacity-70">{pct}%</span>
    </span>
  );
}

/* ── Shared ─────────────────────────────────────────────── */

function AdviceLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-stone-50 px-3.5 py-3">
      <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-clay/70" />
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</dt>
        <dd className="mt-0.5 text-sm leading-6 text-stone-700">{value}</dd>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: AnalyzeResponse["planten"][number]["zekerheid"] }) {
  const config = {
    hoog:   { label: "Hoge zekerheid",        cls: "bg-leaf-50 text-leaf-700 border-leaf-100",    dot: "bg-leaf-500" },
    middel: { label: "Middelmatige zekerheid", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    laag:   { label: "Lage zekerheid",         cls: "bg-red-50 text-red-700 border-red-100",       dot: "bg-red-400" },
    zelf:   { label: "Zelf ingevuld",           cls: "bg-sky-50 text-sky-700 border-sky-100",      dot: "bg-sky-400" },
    onzeker:{ label: "Niet zeker herkend",      cls: "bg-stone-100 text-stone-600 border-stone-200", dot: "bg-stone-400" },
  }[value];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-stone-400";
const inputClass = "rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-[#1f2a1a] outline-none transition focus:border-leaf-400 focus:bg-white focus:ring-2 focus:ring-leaf-100 placeholder:text-stone-400";
const selectClass = "rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-[#1f2a1a] outline-none transition focus:border-leaf-400 focus:bg-white focus:ring-2 focus:ring-leaf-100";

function FormInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} ${className}`} />;
}

function FormSection({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-900 text-[10px] font-semibold text-white">{step}</span>
        <span className="text-sm font-semibold text-[#1f2a1a]">{title}</span>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function FileInput({ label, hint, max, min, files, onFiles }: {
  label: string; hint: string; max: number; min: number; files: File[]; onFiles: (f: File[]) => void;
}) {
  const isValid = files.length >= min;
  const hasFiles = files.length > 0;
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</span>
      <div className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${hasFiles ? isValid ? "border-[#6b9e45]/50 bg-leaf-50" : "border-amber-300 bg-amber-50" : "border-stone-200 bg-stone-50/50 hover:border-leaf-300 hover:bg-leaf-50/50"}`}>
        <div className={`grid h-8 w-8 place-items-center rounded-full ${hasFiles && isValid ? "bg-[#6b9e45]/15" : "bg-stone-100"}`}>
          {hasFiles && isValid ? (
            <svg className="h-4 w-4 text-[#6b9e45]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : <Icon name="flower" className="h-4 w-4 text-stone-400" />}
        </div>
        {hasFiles ? (
          <span className={`text-sm font-medium ${isValid ? "text-[#3d6020]" : "text-amber-800"}`}>
            {files.length} foto{files.length !== 1 ? "'s" : ""} geselecteerd{!isValid ? ` · minimaal ${min} nodig` : ""}
          </span>
        ) : <span className="text-sm text-stone-400">{hint}</span>}
        <span className="text-[11px] text-stone-400">Klik om bestanden te selecteren</span>
        <input type="file" accept="image/*" multiple onChange={(e) => onFiles(Array.from(e.target.files || []).slice(0, max))} className="absolute inset-0 h-full w-full opacity-0" />
      </div>
    </label>
  );
}

/* ── Utilities ──────────────────────────────────────────── */

function getChoiceOptions(id?: PlantIdentification) {
  return Array.from(new Set([...(id?.suggesties.map((s) => s.naam) || []), ...plantOptions]));
}
function getSuggestionScore(id: PlantIdentification | undefined, name: string) {
  return id?.suggesties.find((s) => s.naam === name)?.score;
}

/* ── Icons ──────────────────────────────────────────────── */

type IconName = "water" | "sun" | "leaf" | "flower" | "spinner";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    water:   <path d="M12 3C9 7 6 10.4 6 14a6 6 0 0 0 12 0c0-3.6-3-7-6-11Zm0 17a4 4 0 0 1-4-4" />,
    sun:     <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.4-6.4 1.4-1.4M4.2 19.8l1.4-1.4m0-12.8L4.2 4.2m15.6 15.6-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
    leaf:    <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0c0-4 3-7 7-9" />,
    flower:  <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0c-2 0-4 2-4 4m4-4c2 0 4 2 4 4m-4-4v7m0-13c-2-3-5-3-6-1 0 3 3 4 6 1Zm0 0c2-3 5-3 6-1 0 3-3 4-6 1Z" />,
    spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
