"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { AnalyzeResponse, PlantIdentification } from "./types";

const goals = ["onderhoudsarm", "kleurrijk", "biodivers", "strak", "luxe uitstraling"];
const maintenanceLevels = ["laag", "gemiddeld", "hoog"];
const uncertainPlantLabel = "Nog niet zeker herkend";
const plantOptions = ["Hortensia", "Lavendel", "Beukenhaag", "Olifantsoor", "Siergras", "Klimop", "Roos", "Buxus", "Geranium", uncertainPlantLabel];

type PlantChoice = {
  plant: string;
  customName: string;
  score?: number;
};

type AddressSuggestion = {
  id: string;
  label: string;
};

export default function Home() {
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [goal, setGoal] = useState(goals[2]);
  const [maintenance, setMaintenance] = useState(maintenanceLevels[1]);
  const [overviewPhotos, setOverviewPhotos] = useState<File[]>([]);
  const [plantPhotos, setPlantPhotos] = useState<File[]>([]);
  const [plantChoices, setPlantChoices] = useState<PlantChoice[]>([]);
  const [plantIdentifications, setPlantIdentifications] = useState<PlantIdentification[]>([]);
  const [identificationMessage, setIdentificationMessage] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const plantPreviews = useMemo(() => plantPhotos.map((file) => URL.createObjectURL(file)), [plantPhotos]);

  useEffect(() => {
    return () => {
      plantPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [plantPreviews]);

  const canSubmit = useMemo(
    () =>
      street.trim().length > 1 &&
      houseNumber.trim().length > 0 &&
      postcode.trim().length > 5 &&
      city.trim().length > 1 &&
      overviewPhotos.length >= 1 &&
      overviewPhotos.length <= 2 &&
      plantPhotos.length >= 4 &&
      plantPhotos.length <= 7 &&
      plantChoices.length === plantPhotos.length,
    [city, houseNumber, overviewPhotos.length, plantChoices.length, plantPhotos.length, postcode, street]
  );

  useEffect(() => {
    const query = `${street} ${houseNumber} ${postcode} ${city}`.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/address-suggest?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setAddressSuggestions(Array.isArray(data.suggesties) ? data.suggesties : []);
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [city, houseNumber, postcode, street]);

  function applyAddressSuggestion(label: string) {
    const match = label.match(/^(.+?)\s+([\w\-]+),\s*([1-9][0-9]{3}\s?[A-Z]{2})\s+(.+)$/i);
    if (match) {
      setStreet(match[1]);
      setHouseNumber(match[2]);
      setPostcode(match[3].toUpperCase());
      setCity(match[4]);
    }
    setAddressSuggestions([]);
  }

  async function handlePlantPhotos(files: File[]) {
    setPlantPhotos(files);
    setPlantIdentifications([]);
    setIdentificationMessage("");
    setResult(null);
    setPlantChoices((current) =>
      files.map((_, index) => current[index] || { plant: uncertainPlantLabel, customName: "" })
    );

    if (!files.length) return;

    setIsIdentifying(true);
    try {
      const formData = new FormData();
      files.slice(0, 7).forEach((file) => formData.append("plantPhotos", file));
      const response = await fetch("/api/identify-plants", { method: "POST", body: formData });
      const data = await response.json();
      const resultaten = Array.isArray(data.resultaten) ? (data.resultaten as PlantIdentification[]) : [];
      setPlantIdentifications(resultaten);
      setIdentificationMessage(data.melding || "Automatische herkenning niet beschikbaar. Kies zelf de plantnaam.");
      setPlantChoices((current) =>
        files.map((_, index) => {
          const suggestion = resultaten.find((item) => item.fotoIndex === index)?.suggesties[0];
          if (!suggestion) return current[index] || { plant: uncertainPlantLabel, customName: "" };
          return { plant: suggestion.naam, customName: "", score: suggestion.score };
        })
      );
    } catch {
      setIdentificationMessage("Automatische herkenning niet beschikbaar. Kies zelf de plantnaam.");
    } finally {
      setIsIdentifying(false);
    }
  }

  function updatePlantChoice(index: number, choice: Partial<PlantChoice>) {
    setPlantChoices((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...choice } : item)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.set("street", street);
    formData.set("houseNumber", houseNumber);
    formData.set("postcode", postcode);
    formData.set("city", city);
    formData.set("goal", goal);
    formData.set("maintenance", maintenance);
    formData.set(
      "plantSelections",
      JSON.stringify(
        plantChoices.map((choice, index) => ({
          index,
          plant: choice.plant,
          customName: choice.customName,
          score: choice.score
        }))
      )
    );
    overviewPhotos.forEach((file) => formData.append("overviewPhotos", file));
    plantPhotos.forEach((file) => formData.append("plantPhotos", file));

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analyse mislukt.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse mislukt.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f1] text-leaf-900">
      <div className="bg-clay px-4 py-3 text-center text-sm font-semibold text-white shadow-sm">
        Gratis demo-modus: herkenning via Pl@ntNet, advies op basis van seizoen, weer en plantverzorging.
      </div>
      <section className="border-b border-leaf-100 bg-leaf-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[0.85fr_1.15fr] md:px-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-skysoft">TuinRadar MVP</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">Maandelijks tuinadvies op basis van adres, weer en foto's</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-leaf-100">
                Vul je Nederlandse adres en tuinwens in, upload overzichts- en plantfoto's, en ontvang een compact dashboard in het Nederlands.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-leaf-100">
              <Metric label="Geen login" value="0" />
              <Metric label="Plantfoto's" value="7" />
              <Metric label="Weerdata" value="7d" />
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-lg bg-white p-5 text-leaf-900 shadow-soft">
            <div className="grid gap-4">
              <div className="grid gap-3">
                <span className="text-sm font-semibold">Adres</span>
                <div className="grid gap-3 sm:grid-cols-[1fr_0.45fr]">
                  <input
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder="Straat"
                    className="rounded-md border border-leaf-100 bg-white px-3 py-2 outline-none ring-leaf-500 focus:ring-2"
                  />
                  <input
                    value={houseNumber}
                    onChange={(event) => setHouseNumber(event.target.value)}
                    placeholder="Huisnr."
                    className="rounded-md border border-leaf-100 bg-white px-3 py-2 outline-none ring-leaf-500 focus:ring-2"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[0.55fr_1fr]">
                  <input
                    value={postcode}
                    onChange={(event) => setPostcode(event.target.value)}
                    placeholder="Postcode"
                    className="rounded-md border border-leaf-100 bg-white px-3 py-2 uppercase outline-none ring-leaf-500 focus:ring-2"
                  />
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Plaats"
                    className="rounded-md border border-leaf-100 bg-white px-3 py-2 outline-none ring-leaf-500 focus:ring-2"
                  />
                </div>
                {addressSuggestions.length ? (
                  <div className="grid gap-1 rounded-md border border-leaf-100 bg-leaf-50 p-2">
                    <span className="text-xs font-semibold text-leaf-900">Adres-suggesties</span>
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => applyAddressSuggestion(suggestion.label)}
                        className="rounded-md px-2 py-1 text-left text-sm text-stone-700 hover:bg-white"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Tuinwens</span>
                  <select value={goal} onChange={(event) => setGoal(event.target.value)} className="rounded-md border border-leaf-100 px-3 py-2 outline-none ring-leaf-500 focus:ring-2">
                    {goals.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Onderhoud</span>
                  <select value={maintenance} onChange={(event) => setMaintenance(event.target.value)} className="rounded-md border border-leaf-100 px-3 py-2 outline-none ring-leaf-500 focus:ring-2">
                    {maintenanceLevels.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <FileInput label="1 tot 2 overzichtsfoto's" min={1} max={2} files={overviewPhotos} onFiles={setOverviewPhotos} />
              <FileInput label="4 tot 7 close-up plantfoto's" min={4} max={7} files={plantPhotos} onFiles={handlePlantPhotos} />

              {plantPhotos.length ? (
                <PlantChoices
                  choices={plantChoices}
                  identifications={plantIdentifications}
                  isIdentifying={isIdentifying}
                  message={identificationMessage}
                  previews={plantPreviews}
                  onChange={updatePlantChoice}
                />
              ) : null}

              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <button
                disabled={!canSubmit || isLoading}
                className="rounded-md bg-clay px-4 py-3 font-semibold text-white transition hover:bg-[#995330] disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {isLoading ? "TuinRadar analyseert..." : "Maak tuinadvies"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {result ? <Dashboard result={result} /> : <EmptyState />}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 p-3">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function FileInput({
  label,
  max,
  min,
  files,
  onFiles,
}: {
  label: string;
  max: number;
  min: number;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => onFiles(Array.from(event.target.files || []).slice(0, max))}
        className="rounded-md border border-dashed border-leaf-500 bg-leaf-50 px-3 py-3 text-sm"
      />
      <span className="text-xs text-stone-500">
        {files.length}/{max} geselecteerd{files.length < min ? ` - minimaal ${min} nodig` : ""}
      </span>
    </label>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-leaf-100 bg-white p-8 text-center">
      <div>
        <h2 className="text-2xl font-semibold text-leaf-900">Je dashboard verschijnt hier</h2>
        <p className="mt-2 max-w-xl text-stone-600">De gratis demo gebruikt je plantkeuze, seizoen en actuele weerdata voor persoonlijk tuinadvies.</p>
      </div>
    </div>
  );
}

function Dashboard({ result }: { result: AnalyzeResponse }) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-clay">Dashboard</p>
          <h2 className="mt-1 text-3xl font-semibold text-leaf-900">{result.locatie?.adres || "Tuinadvies"}</h2>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm text-stone-600 shadow-sm">TuinRadar advies</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card title="Tuinscore">
          <div className="flex items-center gap-5">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-leaf-700 text-4xl font-semibold text-white">{result.tuinscore || 72}</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-clay">{result.demo?.tuinscoreTrend.richting || "stabiel"}</p>
              <p className="font-semibold text-leaf-900">{result.tuinprofiel.samenvatting}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{result.demo?.tuinscoreTrend.tekst || result.tuinprofiel.zon_schaduw}</p>
            </div>
          </div>
        </Card>

        <Card title="Deze maand doen">
          <p className="leading-7 text-stone-700">{result.maandadvies}</p>
          <p className="mt-4 rounded-md bg-skysoft px-4 py-3 font-medium text-leaf-900">{result.wow_samenvatting}</p>
        </Card>
      </div>

      {result.demo ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MiniCard icon="sun" title="Tuinweer van deze week" value={result.demo.tuinweer.titel} text={result.demo.tuinweer.tekst} />
          <MiniCard icon="flower" title="Plant van de maand" value={result.demo.plantVanDeMaand.naam} text={result.demo.plantVanDeMaand.actie} />
          <MiniCard icon="water" title="Waterdrukte-indicator" value={result.demo.waterdrukte.niveau} text={result.demo.waterdrukte.tekst} />
          <MiniCard icon="leaf" title="Biodiversiteit-score" value={`${result.demo.biodiversiteitScore.score}/100`} text={result.demo.biodiversiteitScore.tekst} />
          <MiniCard icon="sun" title="Droogtestress-score" value={result.demo.droogtestress.niveau} text={result.demo.droogtestress.uitleg} />
          <MiniCard icon="flower" title="Binnenkort in bloei" value={result.demo.binnenkortInBloei.join(", ")} text="Verwacht binnen 8 weken." />
          <MiniCard icon="leaf" title="Ligging-inschatting" value="Standplaats" text={result.demo.liggingInschatting} />
          <MiniCard icon="leaf" title="Slimme analyse" value="Deze maand" text={result.demo.slimmeAnalyse} wide />
          <EnvironmentCard omgeving={result.demo.omgeving} />
        </div>
      ) : null}

      {result.demo?.waterPerDag ? (
        <Card title="Watergeefadvies per dag">
          <div className="grid gap-3 md:grid-cols-7">
            {result.demo.waterPerDag.map((day) => (
              <WaterDayCard key={day.datum} day={day} />
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Weer & water">
          <p className="font-medium">{result.weeradvies.samenvatting}</p>
          <p className="mt-3 text-sm leading-6 text-stone-600">{result.weeradvies.wateradvies_7_dagen}</p>
          <p className="mt-3 text-sm font-semibold text-clay">Droogterisico: {result.weeradvies.droogte_risico}</p>
        </Card>

        <Card title="Prioriteiten">
          <ol className="grid gap-3">
            {result.prioriteiten.slice(0, 3).map((item, index) => (
              <li key={item} className="flex gap-3 rounded-md bg-leaf-50 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-700 text-sm font-semibold text-white">{index + 1}</span>
                <span className="text-sm leading-6 text-stone-700">{item}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Tuinprofiel">
          <dl className="grid gap-3 text-sm">
            <Row label="Ligging" value={result.tuinprofiel.ligging_inschatting} />
            <Row label="Risico" value={result.tuinprofiel.risico} />
          </dl>
        </Card>
      </div>

      <Card title="Herkende planten">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.planten.map((plant) => (
            <article key={plant.foto} className="rounded-xl border border-leaf-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-clay">{plant.foto}</p>
                  <h3 className="mt-1 text-lg font-semibold text-leaf-900">{plant.waarschijnlijke_plant}</h3>
                </div>
                <ConfidenceBadge value={plant.zekerheid} />
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-700">{plant.gezondheid}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <AdviceLine icon="water" label="Water" value={plant.water} />
                <AdviceLine icon="leaf" label="Snoei" value={plant.snoei} />
                <AdviceLine icon="flower" label="Deze maand" value={plant.actie_deze_maand} />
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">{plant.opmerking}</p>
              {plant.zekerheid !== "hoog" ? <p className="mt-3 text-xs font-medium text-amber-800">Controleer plantnaam bij twijfel.</p> : null}
            </article>
          ))}
        </div>
      </Card>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Disclaimer: slimme demo-inschatting op basis van plantkeuze, seizoen en weer; controleer bij twijfel.
      </p>
    </div>
  );
}

function MiniCard({ icon, title, value, text, wide = false }: { icon: IconName; title: string; value: string; text: string; wide?: boolean }) {
  return (
    <section className={`rounded-xl border border-leaf-100 bg-white p-5 shadow-soft ${wide ? "xl:col-span-2" : ""}`}>
      <div className="flex items-center gap-2">
        <Icon name={icon} className="h-4 w-4 text-clay" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">{title}</p>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-leaf-900">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
    </section>
  );
}

function EnvironmentCard({ omgeving }: { omgeving: NonNullable<AnalyzeResponse["demo"]>["omgeving"] }) {
  return (
    <section className="rounded-xl border border-leaf-100 bg-white p-5 shadow-soft xl:col-span-2">
      <div className="flex items-center gap-2">
        <Icon name="leaf" className="h-4 w-4 text-clay" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">Omgeving en perceelgevoel</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
        {omgeving.kaartUrl ? (
          <div className="overflow-hidden rounded-xl border border-leaf-100 bg-leaf-50 p-2">
            <img src={omgeving.kaartUrl} alt="OpenStreetMap contexttegel" className="h-32 w-full rounded-lg object-cover" />
          </div>
        ) : (
          <div className="grid h-32 place-items-center rounded-xl bg-leaf-50 text-sm text-stone-500">Geen kaartpositie</div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-leaf-900">{omgeving.type}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{omgeving.perceelgevoel}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{omgeving.nabijheid}</p>
        </div>
      </div>
    </section>
  );
}

function WaterDayCard({ day }: { day: NonNullable<AnalyzeResponse["demo"]>["waterPerDag"][number] }) {
  const styles = {
    "geen water nodig": "border-leaf-100 bg-leaf-50 text-leaf-800",
    "licht water geven": "border-amber-200 bg-amber-50 text-amber-900",
    "extra water geven": "border-red-200 bg-red-50 text-red-900"
  }[day.advies];
  const bars = day.advies === "extra water geven" ? 3 : day.advies === "licht water geven" ? 2 : 1;

  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">{day.datum}</p>
        <Icon name="water" className="h-4 w-4" />
      </div>
      <div className="mt-3 flex gap-1">
        {[0, 1, 2].map((item) => (
          <span key={item} className={`h-1.5 flex-1 rounded-full ${item < bars ? "bg-current" : "bg-white/70"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold">{day.advies}</p>
      <p className="mt-1 text-xs leading-5 text-stone-600">{day.reden}</p>
    </div>
  );
}

function PlantChoices({
  choices,
  identifications,
  isIdentifying,
  message,
  previews,
  onChange
}: {
  choices: PlantChoice[];
  identifications: PlantIdentification[];
  isIdentifying: boolean;
  message: string;
  previews: string[];
  onChange: (index: number, choice: Partial<PlantChoice>) => void;
}) {
  return (
    <div className="grid gap-3">
      <span className="text-sm font-semibold">Bevestig de plant per foto</span>
      <p className="rounded-md bg-skysoft px-3 py-2 text-sm font-medium text-leaf-900">
        {isIdentifying ? "Automatische Pl@ntNet-herkenning loopt..." : message || "Kies zelf of gebruik de voorgestelde plantnaam."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((choice, index) => (
          <div key={`${previews[index]}-${index}`} className="grid gap-3 rounded-md border border-leaf-100 bg-leaf-50 p-3">
            <img src={previews[index]} alt={`Plantfoto ${index + 1}`} className="h-32 w-full rounded-md object-cover" />
            <PlantSuggestions identification={identifications.find((item) => item.fotoIndex === index)} />
            <label className="grid gap-2">
              <span className="text-xs font-semibold text-leaf-900">Welke plant is dit?</span>
              <select
                value={choice.plant}
                onChange={(event) => onChange(index, { plant: event.target.value, score: getSuggestionScore(identifications.find((item) => item.fotoIndex === index), event.target.value) })}
                className="rounded-md border border-leaf-100 bg-white px-3 py-2 text-sm outline-none ring-leaf-500 focus:ring-2"
              >
                {getChoiceOptions(identifications.find((item) => item.fotoIndex === index)).map((plant) => (
                  <option key={plant}>{plant}</option>
                ))}
              </select>
            </label>
            {choice.plant === uncertainPlantLabel ? (
              <label className="grid gap-2">
                <span className="text-xs font-semibold text-leaf-900">Anders, namelijk</span>
                <input
                  value={choice.customName}
                  onChange={(event) => onChange(index, { customName: event.target.value })}
                  placeholder="Bijv. Japanse esdoorn"
                  className="rounded-md border border-leaf-100 bg-white px-3 py-2 text-sm outline-none ring-leaf-500 focus:ring-2"
                />
              </label>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlantSuggestions({ identification }: { identification?: PlantIdentification }) {
  if (!identification) {
    return <p className="text-xs text-stone-500">Nog geen suggesties.</p>;
  }

  if (identification.foutmelding && !identification.suggesties.length) {
    return <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">{identification.foutmelding}</p>;
  }

  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold text-leaf-900">Top 3 Pl@ntNet-suggesties</span>
      {identification.suggesties.map((suggestion) => (
        <div key={`${suggestion.naam}-${suggestion.score}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs shadow-sm">
          <span>
            <span className="font-semibold text-leaf-900">{suggestion.naam}</span>
            {suggestion.wetenschappelijkeNaam ? <span className="block italic text-stone-500">{suggestion.wetenschappelijkeNaam}</span> : null}
          </span>
          <SuggestionBadge score={suggestion.score} />
        </div>
      ))}
      {identification.foutmelding ? <p className="text-xs text-amber-800">{identification.foutmelding}</p> : null}
    </div>
  );
}

function SuggestionBadge({ score }: { score: number }) {
  const label = score >= 0.55 ? "Hoge zekerheid" : score >= 0.25 ? "Middelmatige zekerheid" : "Lage zekerheid";
  const color = score >= 0.55 ? "bg-leaf-100 text-leaf-700" : score >= 0.25 ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800";
  return (
    <span className={`shrink-0 rounded-full px-2 py-1 text-right font-semibold ${color}`}>
      {label}
      <span className="block text-[10px] opacity-80">{Math.round(score * 100)}%</span>
    </span>
  );
}

function getChoiceOptions(identification?: PlantIdentification) {
  const suggestions = identification?.suggesties.map((suggestion) => suggestion.naam) || [];
  return Array.from(new Set([...suggestions, ...plantOptions]));
}

function getSuggestionScore(identification: PlantIdentification | undefined, plantName: string) {
  return identification?.suggesties.find((suggestion) => suggestion.naam === plantName)?.score;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-leaf-100 bg-white p-6 shadow-soft">
      <h2 className="mb-5 text-lg font-semibold text-leaf-900">{title}</h2>
      {children}
    </section>
  );
}

function AdviceLine({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-leaf-50 p-3">
      <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
      <div>
        <dt className="font-semibold text-leaf-900">{label}</dt>
        <dd className="mt-1 leading-6 text-stone-600">{value}</dd>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: "laag" | "middel" | "hoog" }) {
  const config = {
    hoog: ["Hoge zekerheid", "bg-leaf-100 text-leaf-700 border-leaf-100"],
    middel: ["Middelmatige zekerheid", "bg-amber-50 text-amber-800 border-amber-200"],
    laag: ["Lage zekerheid", "bg-red-50 text-red-800 border-red-100"]
  }[value];

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${config[1]}`}>{config[0]}</span>;
}

type IconName = "water" | "sun" | "leaf" | "flower";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths = {
    water: <path d="M12 3C9 7 6 10.4 6 14a6 6 0 0 0 12 0c0-3.6-3-7-6-11Zm0 17a4 4 0 0 1-4-4" />,
    sun: <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.4-6.4 1.4-1.4M4.2 19.8l1.4-1.4m0-12.8L4.2 4.2m15.6 15.6-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
    leaf: <path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Zm0 0c0-4 3-7 7-9" />,
    flower: <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0c-2 0-4 2-4 4m4-4c2 0 4 2 4 4m-4-4v7m0-13c-2-3-5-3-6-1 0 3 3 4 6 1Zm0 0c2-3 5-3 6-1 0 3-3 4-6 1Z" />
  }[name];

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths}
    </svg>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-leaf-900">{label}</dt>
      <dd className="mt-1 leading-6 text-stone-600">{value}</dd>
    </div>
  );
}
