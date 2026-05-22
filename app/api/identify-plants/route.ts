import { NextResponse } from "next/server";
import type { PlantIdentification, PlantSuggestion } from "../../types";

export const runtime = "nodejs";

type PlantNetSpecies = {
  scientificNameWithoutAuthor?: string;
  scientificNameAuthorship?: string;
  scientificName?: string;
  commonNames?: string[];
};

type PlantNetResult = {
  score?: number;
  species?: PlantNetSpecies;
};

type PlantNetResponse = {
  results?: PlantNetResult[];
};

export async function POST(request: Request) {
  const apiKey = process.env.PLANTNET_API_KEY?.trim();
  const formData = await request.formData();
  const files = formData.getAll("plantPhotos").filter(isFile).slice(0, 7);

  if (!files.length) {
    return NextResponse.json({ error: "Geen plantfoto's ontvangen." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      beschikbaar: false,
      melding: "Automatische herkenning niet beschikbaar. Kies zelf de plantnaam.",
      resultaten: files.map((_, fotoIndex) => ({
        fotoIndex,
        suggesties: [],
        foutmelding: "PLANTNET_API_KEY ontbreekt."
      }))
    });
  }

  const resultaten = await Promise.all(files.map((file, fotoIndex) => identifyPlant(file, fotoIndex, apiKey)));

  return NextResponse.json({
    beschikbaar: true,
    melding: resultaten.some((item) => item.foutmelding)
      ? "Sommige foto's konden niet automatisch worden herkend. Controleer de plantnaam."
      : "Automatische herkenning voltooid.",
    resultaten
  });
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
}

async function identifyPlant(file: File, fotoIndex: number, apiKey: string): Promise<PlantIdentification> {
  const body = new FormData();
  body.append("images", file, file.name || `plant-${fotoIndex + 1}.jpg`);
  body.append("organs", "auto");

  const url = new URL("https://my-api.plantnet.org/v2/identify/all");
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("nb-results", "3");
  url.searchParams.set("lang", "nl");
  url.searchParams.set("no-reject", "true");

  try {
    const response = await fetch(url, {
      method: "POST",
      body
    });

    if (!response.ok) {
      return {
        fotoIndex,
        suggesties: [],
        foutmelding: `Pl@ntNet gaf HTTP ${response.status}.`
      };
    }

    const data = (await response.json()) as PlantNetResponse;
    const suggesties = (data.results || []).slice(0, 3).map(toSuggestion).filter(Boolean) as PlantSuggestion[];

    return {
      fotoIndex,
      suggesties,
      foutmelding: suggesties.length ? undefined : "Geen betrouwbare suggesties gevonden."
    };
  } catch (error) {
    return {
      fotoIndex,
      suggesties: [],
      foutmelding: error instanceof Error ? error.message : "Pl@ntNet-herkenning mislukt."
    };
  }
}

function toSuggestion(result: PlantNetResult): PlantSuggestion | null {
  const species = result.species;
  if (!species) return null;
  const scientificName = species.scientificNameWithoutAuthor || species.scientificName || "";
  const commonName = species.commonNames?.[0];
  const name = commonName || scientificName;
  if (!name) return null;

  return {
    naam: name,
    wetenschappelijkeNaam: scientificName,
    score: typeof result.score === "number" ? result.score : 0
  };
}
