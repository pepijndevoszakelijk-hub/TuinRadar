import { NextResponse } from "next/server";
import type { AnalyzeResponse, GardenAdvice, PlantAdvice } from "../../types";

export const runtime = "nodejs";

type WeatherSummary = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    precipitation_sum?: number[];
    et0_fao_evapotranspiration?: number[];
    shortwave_radiation_sum?: number[];
  };
};

type PlantSelection = {
  index: number;
  plant: string;
  customName?: string;
  score?: number;
};

type GardenProfile = {
  gardenType: string;
  sunProfile: string;
  greenLevel: string;
  goal: string;
  maintenance: string;
};

type PlantRule = {
  health: string;
  water: string;
  prune: Record<string, string>;
  action: Record<string, string>;
  note: string;
  bloomMonths: number[];
  biodiversity: number;
};

const plantRules: Record<string, PlantRule> = {
  Hortensia: {
    health: "Let op slap blad bij middagzon; hortensia's reageren snel op droogte.",
    water: "Houd de kluit gelijkmatig vochtig en geef liever diep water dan elke dag een beetje.",
    prune: {
      lente: "Knip oude bloemschermen weg tot net boven een sterk knoppenpaar.",
      zomer: "Snoei niet stevig; verwijder alleen dode of beschadigde takken.",
      herfst: "Laat uitgebloeide schermen grotendeels zitten als winterbescherming.",
      winter: "Wacht met snoei tot het risico op stevige vorst voorbij is."
    },
    action: {
      lente: "Geef compost en controleer of de plant niet te droog staat.",
      zomer: "Mulch de bodem en geef extra water tijdens warme dagen.",
      herfst: "Verwijder alleen ziek blad en laat structuur staan.",
      winter: "Bescherm jonge planten met bladmulch rond de voet."
    },
    note: "Past goed bij een kleurrijke of luxe uitstraling als de vochtbalans klopt.",
    bloomMonths: [6, 7, 8, 9],
    biodiversity: 3
  },
  Lavendel: {
    health: "Lavendel wil lucht, zon en droge voeten; natte grond is het grootste risico.",
    water: "Geef spaarzaam water, alleen bij langdurige droogte of jonge aanplant.",
    prune: {
      lente: "Knip licht terug tot boven het oude hout om compacte groei te houden.",
      zomer: "Knip uitgebloeide aren weg voor een nette tweede indruk.",
      herfst: "Snoei niet diep meer; voorkom zachte nieuwe groei voor de winter.",
      winter: "Niet snoeien bij vorst of natte kou."
    },
    action: {
      lente: "Zet vrij van overhangende planten en verbeter drainage waar nodig.",
      zomer: "Oogst of verwijder bloemen zodra ze verkleuren.",
      herfst: "Haal gevallen blad rond de basis weg.",
      winter: "Controleer dat de plant niet in natte grond staat."
    },
    note: "Sterke keuze voor onderhoudsarm, biodivers en mediterrane sfeer.",
    bloomMonths: [6, 7, 8],
    biodiversity: 5
  },
  Beukenhaag: {
    health: "Een beukenhaag toont stress via dor of dun blad; gelijkmatige vochtigheid helpt herstel.",
    water: "Geef jonge hagen diep water bij droge weken, volwassen hagen alleen bij langdurige droogte.",
    prune: {
      lente: "Corrigeer lichte uitschieters, maar wacht met strak knippen tot de groeispurt zichtbaar is.",
      zomer: "Scheer de haag strak op een bewolkte dag om bladverbranding te beperken.",
      herfst: "Een lichte vormcorrectie kan, maar snoei niet te laat en niet bij vorstverwachting.",
      winter: "Alleen dode takken verwijderen."
    },
    action: {
      lente: "Maak de voet onkruidvrij en geef compost langs de haaglijn.",
      zomer: "Plan een scheerbeurt en geef water na hete dagen.",
      herfst: "Vul kale plekken aan en mulch de voet.",
      winter: "Controleer bindmateriaal en stormschade."
    },
    note: "Draagt sterk bij aan een strak tuinbeeld en privacy.",
    bloomMonths: [4, 5],
    biodiversity: 2
  },
  Olifantsoor: {
    health: "Grote bladeren verdampen veel water; bruine randen wijzen vaak op droogte, wind of felle zon.",
    water: "Houd de grond constant licht vochtig, vooral bij potten en warme dagen.",
    prune: {
      lente: "Verwijder oude of beschadigde bladeren zodra nieuwe groei op gang komt.",
      zomer: "Knip lelijk blad bij de basis weg voor nieuwe energie.",
      herfst: "Verwijder geel blad en bereid vorstbescherming voor.",
      winter: "Bescherm tegen kou; buiten alleen laten staan op een zeer beschutte plek."
    },
    action: {
      lente: "Start voeding zodra de groei zichtbaar is.",
      zomer: "Geef regelmatig water en beschut tegen harde middagzon.",
      herfst: "Zet potten beschut en verminder voeding.",
      winter: "Vorstvrij overwinteren of stevig beschermen."
    },
    note: "Geeft direct een luxe, tropische uitstraling maar vraagt consequente verzorging.",
    bloomMonths: [],
    biodiversity: 1
  },
  Siergras: {
    health: "Siergras is vaak robuust; bruine halmen zijn meestal normaal aan het einde van het seizoen.",
    water: "Geef alleen extra water bij jonge planten of droge, hete periodes.",
    prune: {
      lente: "Knip oude halmen terug voordat de nieuwe scheuten hoog worden.",
      zomer: "Niet snoeien; kam losse dorre halmen eventueel met de hand uit.",
      herfst: "Laat pluimen staan voor structuur en winterbeeld.",
      winter: "Laat staan tot het einde van de winter."
    },
    action: {
      lente: "Knip terug en deel te grote pollen indien nodig.",
      zomer: "Houd de voet vrij en geef water bij droogtestress.",
      herfst: "Laat zaadpluimen staan voor sfeer en biodiversiteit.",
      winter: "Bind hoge pollen losjes op bij zware wind."
    },
    note: "Goed voor onderhoudsarme structuur en beweging in de tuin.",
    bloomMonths: [8, 9, 10],
    biodiversity: 3
  },
  Klimop: {
    health: "Klimop is sterk, maar kan snel te dominant worden als randen niet worden bijgehouden.",
    water: "Na vestiging weinig water nodig; jonge planten bij droogte wekelijks diep water geven.",
    prune: {
      lente: "Knip groeipunten terug om de vorm te sturen.",
      zomer: "Houd ramen, dakranden en kwetsbare planten vrij.",
      herfst: "Lichte correctie kan; laat bloeiende delen staan voor insecten.",
      winter: "Beperk snoei tot hinderlijke of beschadigde scheuten."
    },
    action: {
      lente: "Controleer hechting en leid scheuten waar gewenst.",
      zomer: "Snoei randen strak en voorkom overgroei.",
      herfst: "Laat bessen en bloemen deels staan voor biodiversiteit.",
      winter: "Controleer muren, schuttingen en boomstammen."
    },
    note: "Handig voor groenblijvende dekking, maar vraagt begrenzing.",
    bloomMonths: [9, 10],
    biodiversity: 5
  },
  Roos: {
    health: "Controleer op luis, meeldauw en zwarte vlekken; luchtige groei voorkomt veel problemen.",
    water: "Geef aan de voet water en houd blad zo droog mogelijk.",
    prune: {
      lente: "Snoei zwakke, kruisende en dode takken weg en open het hart van de plant.",
      zomer: "Knip uitgebloeide bloemen terug tot een sterk blad voor nieuwe bloei.",
      herfst: "Verwijder ziek blad en snoei lange takken licht terug tegen windschade.",
      winter: "Wacht met hoofdsnoei tot het einde van de winter."
    },
    action: {
      lente: "Geef rozenmest en mulch de bodem.",
      zomer: "Blijf deadheaden en controleer wekelijks op luis.",
      herfst: "Ruim ziek blad op en verbeter lucht rond de plant.",
      winter: "Bescherm de voet bij strenge vorst."
    },
    note: "Sterke match met kleurrijk en luxe, mits snoei en voeding consequent zijn.",
    bloomMonths: [6, 7, 8, 9],
    biodiversity: 4
  },
  Buxus: {
    health: "Let op vraat, spinsel en bruine plekken; buxus vraagt snelle controle bij stress.",
    water: "Houd gelijkmatig vochtig, vooral in potten, maar voorkom natte voeten.",
    prune: {
      lente: "Knip licht in vorm op een bewolkte dag.",
      zomer: "Scheer strak bij koel, bewolkt weer en geef daarna water.",
      herfst: "Geen zware snoei meer; laat herstelgroei afharden.",
      winter: "Niet snoeien."
    },
    action: {
      lente: "Controleer op rups en geef organische voeding.",
      zomer: "Inspecteer binnenin de plant en verwijder aangetast materiaal.",
      herfst: "Verbeter luchtcirculatie en ruim bladresten op.",
      winter: "Bescherm potten tegen uitdrogen bij vorst."
    },
    note: "Geschikt voor strak en luxe, maar ziekte- en plaagcontrole is belangrijk.",
    bloomMonths: [],
    biodiversity: 1
  },
  Geranium: {
    health: "Geraniums herstellen snel, maar bloeien beter als oude bloemen worden weggehaald.",
    water: "Geef bij potten regelmatig water; vollegrondgeraniums zijn vaak zuiniger.",
    prune: {
      lente: "Knip oude resten terug en geef ruimte aan nieuwe scheuten.",
      zomer: "Verwijder uitgebloeide bloemen en lelijk blad.",
      herfst: "Knip terug als de plant slordig wordt.",
      winter: "Bescherm niet-winterharde soorten of zet ze vorstvrij."
    },
    action: {
      lente: "Geef compost en laat jonge scheuten opkomen.",
      zomer: "Deadhead wekelijks voor langere bloei.",
      herfst: "Scheur of verplaats pollen indien nodig.",
      winter: "Controleer potten en overwinter vorstgevoelige soorten."
    },
    note: "Goede vuller voor kleur, biodiversiteit en lage drempel in onderhoud.",
    bloomMonths: [5, 6, 7, 8, 9],
    biodiversity: 4
  },
  "Nog niet zeker herkend": {
    health: "Deze plant vraagt eerst om rustig observeren: kijk vooral naar blad, bloem en groeiwijze.",
    water: "Controleer de bovenste laag grond. Droog betekent water geven; koel of vochtig betekent wachten.",
    prune: {
      lente: "Haal alleen dood of beschadigd materiaal weg.",
      zomer: "Knip alleen lelijk, ziek of hinderlijk blad weg.",
      herfst: "Snoei weinig; laat de plant rustig afharden.",
      winter: "Laat met rust, behalve bij schade."
    },
    action: {
      lente: "Geef ruimte rond de plant en volg nieuwe groei.",
      zomer: "Let op bloei en bladkleur; dat zegt veel over verzorging.",
      herfst: "Ruim ziek blad op en houd de voet luchtig.",
      winter: "Bescherm tegen natte voeten en harde vorst."
    },
    note: "Rustig verzorgen werkt hier beter dan stevig ingrijpen.",
    bloomMonths: [],
    biodiversity: 2
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const address = buildAddress(formData);
    const profile = readGardenProfile(formData);
    const plantFiles = formData.getAll("plantPhotos").filter(isFile).slice(0, 7);
    const plantSelections = parsePlantSelections(String(formData.get("plantSelections") || "[]"));

    if (!address) {
      return NextResponse.json({ error: "Straat, huisnummer, postcode en plaats zijn verplicht." }, { status: 400 });
    }

    if (plantFiles.length < 4) {
      return NextResponse.json({ error: "Upload minimaal 4 plantfoto's." }, { status: 400 });
    }

    const location = await geocodeAddress(address);
    const weather = location ? await fetchWeather(location.lat, location.lon) : null;
    const advice = createRuleBasedAdvice({
      profile,
      weather,
      plantCount: plantFiles.length,
      plantSelections,
      location
    });

    const response: AnalyzeResponse = {
      ...advice,
      locatie: {
        adres: location?.label || address,
        lat: location?.lat,
        lon: location?.lon
      },
      bronnen: {
        pdok: Boolean(location),
        openMeteo: Boolean(weather),
        advies: true
      }
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Je tuinadvies kon niet worden samengesteld. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}

function buildAddress(formData: FormData) {
  const street = String(formData.get("street") || "").trim();
  const houseNumber = String(formData.get("houseNumber") || "").trim();
  const postcode = String(formData.get("postcode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  if (!street || !houseNumber || !postcode || !city) return "";
  return `${street} ${houseNumber}, ${postcode} ${city}`;
}

function readGardenProfile(formData: FormData): GardenProfile {
  const goal = String(formData.get("goal") || "Meer biodiversiteit");
  return {
    gardenType: String(formData.get("gardenType") || "Compacte stadstuin"),
    sunProfile: String(formData.get("sunProfile") || "Gemengd"),
    greenLevel: String(formData.get("greenLevel") || "Gemengd"),
    goal,
    maintenance: String(formData.get("maintenance") || "gemiddeld")
  };
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && value.size > 0;
}

function parsePlantSelections(value: string): PlantSelection[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, index) => ({
      index: Number.isFinite(item?.index) ? item.index : index,
      plant: normalizePlantName(typeof item?.plant === "string" ? item.plant : "Nog niet zeker herkend"),
      customName: typeof item?.customName === "string" ? item.customName.trim() : "",
      score: typeof item?.score === "number" ? item.score : undefined
    }));
  } catch {
    return [];
  }
}

function normalizePlantName(value: string) {
  return value.trim() || "Nog niet zeker herkend";
}

async function geocodeAddress(address: string): Promise<{ label: string; lat: number; lon: number } | null> {
  const url = new URL("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free");
  url.searchParams.set("q", address);
  url.searchParams.set("rows", "1");
  url.searchParams.set("fl", "weergavenaam,centroide_ll");

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.response?.docs?.[0];
    const point = String(doc?.centroide_ll || "");
    const match = point.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) return null;
    return {
      label: doc.weergavenaam || address,
      lon: Number(match[1]),
      lat: Number(match[2])
    };
  } catch {
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherSummary | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "temperature_2m_max,precipitation_sum,et0_fao_evapotranspiration,shortwave_radiation_sum");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "Europe/Amsterdam");

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function createRuleBasedAdvice(input: {
  profile: GardenProfile;
  weather: WeatherSummary | null;
  plantCount: number;
  plantSelections: PlantSelection[];
  location: { label: string; lat: number; lon: number } | null;
}): GardenAdvice {
  const month = getCurrentMonth();
  const season = getSeason();
  const weatherProfile = getWeatherProfile(input.weather);
  const selectedPlants = Array.from({ length: input.plantCount }, (_, index) => {
    const selection = input.plantSelections[index];
    const basePlant = normalizePlantName(selection?.plant || "Nog niet zeker herkend");
    const plantName = basePlant === "Nog niet zeker herkend" && selection?.customName ? selection.customName : basePlant;
    return { basePlant, plantName, score: selection?.score, isCustom: basePlant === "Nog niet zeker herkend" && Boolean(selection?.customName) };
  });
  const plants = selectedPlants.map((plant, index) =>
    createPlantAdvice(index, plant.plantName, plant.basePlant, plant.score, plant.isCustom, season, weatherProfile, input.profile.goal, input.profile.maintenance)
  );

  const priorities = createPriorities(plants, weatherProfile, input.profile);

  return addScore({
    tuinprofiel: {
      samenvatting: createProfileSummary(input.profile, selectedPlants, weatherProfile),
      ligging_inschatting: createLocationProfile(input.profile, input.location),
      zon_schaduw: createSunShadeAdvice(input.profile),
      risico: weatherProfile.warning
    },
    weeradvies: {
      samenvatting: weatherProfile.summary,
      wateradvies_7_dagen: weatherProfile.waterAdvice,
      droogte_risico: weatherProfile.dryRisk
    },
    planten: plants,
    prioriteiten: priorities,
    maandadvies: createMonthlyAdvice(season, input.profile, weatherProfile),
    wow_samenvatting: createSmartInsight(plants, weatherProfile, input.profile),
    demo: createDemoCards(selectedPlants, plants, month, weatherProfile, input.profile, input.location)
  });
}

function createProfileSummary(profile: GardenProfile, selectedPlants: Array<{ basePlant: string; plantName: string }>, weather: ReturnType<typeof getWeatherProfile>) {
  const knownCount = selectedPlants.filter((plant) => plant.basePlant !== "Nog niet zeker herkend").length;
  const dryText = getProfileDryness(profile, weather) === "hoog" ? "droogtegevoelige" : getProfileDryness(profile, weather) === "gemiddeld" ? "gemiddeld droge" : "relatief rustige";
  return `${profile.gardenType} met ${profile.sunProfile.toLowerCase()} en ${profile.greenLevel.toLowerCase()}. Deze maand vraagt dit om ${dryText} verzorging rond ${knownCount || selectedPlants.length} planten.`;
}

function createLocationProfile(profile: GardenProfile, location: { label: string; lat: number; lon: number } | null) {
  const setting = location && isLikelyUrban(location.label) ? "stedelijke ligging" : "woongebied met tuinkarakter";
  if (profile.greenLevel === "Veel bestrating") return `${setting}; verharding warmt sneller op en vraagt scherpere watercontrole.`;
  if (profile.greenLevel === "Vooral groen") return `${setting}; veel groen dempt warmte en houdt de bodem langer actief.`;
  return `${setting}; een mix van groen en verharding geeft ruimte voor gerichte accenten.`;
}

function createPlantAdvice(
  index: number,
  plantName: string,
  basePlant: string,
  score: number | undefined,
  isCustom: boolean,
  season: string,
  weather: ReturnType<typeof getWeatherProfile>,
  goal: string,
  maintenance: string
): PlantAdvice {
  const rule = plantRules[basePlant] || plantRules["Nog niet zeker herkend"];
  const heatExtra = weather.isHotDry ? " Controleer op warme middagen of het blad slap hangt." : "";
  const goalExtra = goal === "Meer biodiversiteit" ? " Laat een deel van bloemen en zaadhoofden staan." : goal === "Strakkere uitstraling" ? " Houd randen compact voor rust in het beeld." : "";
  const maintenanceExtra = maintenance === "laag" ? " Bundel dit in een korte wekelijkse ronde." : maintenance === "hoog" ? " Volg bladkleur en vocht vaker op." : "";

  return {
    foto: `Plant ${index + 1}`,
    waarschijnlijke_plant: plantName,
    zekerheid: getConfidence(score, basePlant, isCustom),
    gezondheid: `${rule.health}${heatExtra}`,
    water: `${rule.water} ${weather.plantWaterSuffix}`.trim(),
    snoei: rule.prune[season],
    actie_deze_maand: `${rule.action[season]}${goalExtra}${maintenanceExtra}`,
    opmerking: isCustom || basePlant === "Nog niet zeker herkend"
      ? "Controleer de plantnaam voor specifieker advies."
      : rule.note
  };
}

function getConfidence(score: number | undefined, basePlant: string, isCustom: boolean): PlantAdvice["zekerheid"] {
  if (isCustom) return "zelf";
  if (basePlant === "Nog niet zeker herkend") return "onzeker";
  if (typeof score !== "number") return "zelf";
  if (score >= 0.55) return "hoog";
  if (score >= 0.25) return "middel";
  return "laag";
}

function getSeason() {
  const month = getCurrentMonth();
  if (month >= 3 && month <= 5) return "lente";
  if (month >= 6 && month <= 8) return "zomer";
  if (month >= 9 && month <= 11) return "herfst";
  return "winter";
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getWeatherProfile(weather: WeatherSummary | null) {
  const rain = sum(weather?.daily?.precipitation_sum);
  const evaporation = sum(weather?.daily?.et0_fao_evapotranspiration);
  const radiation = sum(weather?.daily?.shortwave_radiation_sum);
  const temps = weather?.daily?.temperature_2m_max || [];
  const maxTemp = temps.length ? Math.max(...temps) : 18;
  const isSunny = radiation > 95;
  const isHotDry = maxTemp >= 25 && rain < 8;
  const isDry = rain < 5 || evaporation > rain + 8 || (isSunny && rain < 12);
  const isWet = rain > 25;
  const dryRisk = isHotDry ? "hoog" : isDry ? "middel" : "laag";

  return {
    rain,
    evaporation,
    radiation,
    maxTemp,
    isHotDry,
    isDry,
    isWet,
    isSunny,
    dryRisk,
    summary: weather
      ? `Komende 7 dagen: ongeveer ${rain.toFixed(0)} mm regen, piektemperatuur rond ${maxTemp.toFixed(0)} graden en verdamping circa ${evaporation.toFixed(0)} mm.`
      : "Weerdata kon niet worden opgehaald; daarom tonen we een rustig seizoensadvies.",
    warning: isHotDry
      ? "Warm en droog weer: verhoogde kans op droogtestress bij potten, jonge aanplant en grootbladige planten."
      : isWet
        ? "Natte week: let op slakken, schimmelgevoelige planten en potten zonder goede afwatering."
        : "Geen extreem weerrisico zichtbaar, maar controleer potten en jonge aanplant wekelijks.",
    waterAdvice: weather
      ? createWaterAdvice(rain, maxTemp, dryRisk, isWet)
      : "Controleer de bovenste 5 cm grond. Geef alleen water als die droog aanvoelt en geef dan diep aan de voet.",
    plantWaterSuffix: isHotDry
      ? "Deze week vooral vroeg in de ochtend water geven."
      : isWet
        ? "Sla gietbeurten over als de grond nat blijft."
        : "Controleer twee keer per week de bovenlaag van de grond.",
    daily: (weather?.daily?.time || []).map((date, index) => ({
      date,
      temp: weather?.daily?.temperature_2m_max?.[index] ?? 18,
      rain: weather?.daily?.precipitation_sum?.[index] ?? 0,
      radiation: weather?.daily?.shortwave_radiation_sum?.[index] ?? 0
    }))
  };
}

function createWaterAdvice(rain: number, maxTemp: number, dryRisk: string, isWet: boolean) {
  if (isWet) return `Er valt naar verwachting ${rain.toFixed(0)} mm regen. Geef alleen potten onder overstek water en controleer afwatering.`;
  if (dryRisk === "hoog") return `Warm en droog: geef 2 tot 3 keer diep water aan potten en jonge aanplant, bij voorkeur voor 09:00.`;
  if (dryRisk === "middel") return `Droge balans: geef 1 tot 2 keer diep water aan dorstige planten en controleer grootbladige soorten na dagen boven ${maxTemp.toFixed(0)} graden.`;
  return `Normale week: meestal volstaat controleren. Geef alleen water als de bodem droog aanvoelt.`;
}

function createPriorities(plants: PlantAdvice[], weather: ReturnType<typeof getWeatherProfile>, profile: GardenProfile) {
  const first = weather.isHotDry
    ? "Zet watercontrole bovenaan: potten, jonge planten en groot blad eerst."
    : weather.isWet
      ? "Controleer afwatering en haal ziek of nat blad uit dicht plantwerk."
      : profile.greenLevel === "Veel bestrating"
        ? "Controleer droge randen langs tegels; daar loopt water snel weg."
        : "Loop de tuin eenmaal rustig na en noteer droge plekken, onkruid en uitgebloeide bloemen.";
  const second = profile.goal === "Strakkere uitstraling"
    ? "Werk zichtlijnen, hagen en randen bij voor direct meer rust en kwaliteit."
    : profile.goal === "Meer biodiversiteit"
      ? "Laat bloeiende planten en zaadhoofden deels staan voor bestuivers."
      : profile.goal === "Mediterrane uitstraling"
        ? "Geef zonminnende planten lucht en houd de bodem liever droog dan nat."
        : "Versterk kleur en bloei door uitgebloeide bloemen gericht weg te knippen.";
  const third = profile.maintenance === "laag"
    ? "Bundel onderhoud in een vast wekelijks kwartier: water, onkruid, snoei alleen waar nodig."
    : `Pak deze maand vooral ${plants[0]?.waarschijnlijke_plant || "de belangrijkste plant"} aan als eerste zichtbare verbetering.`;
  return [first, second, third];
}

function createSunShadeAdvice(profile: GardenProfile) {
  if (profile.sunProfile === "Veel schaduw") return "Kies rustige bladplanten en geef minder vaak water; schaduw houdt de bodem langer koel.";
  if (profile.sunProfile === "Vooral middagzon") return "Middagzon maakt water in de ochtend belangrijker, zeker langs tegels en muren.";
  if (profile.goal === "Meer biodiversiteit") return "Zonplekken zijn waardevol voor bloemen en bestuivers; laat bloei daar langer staan.";
  if (profile.goal === "Mediterrane uitstraling") return "Zonnige, drogere plekken passen goed bij lavendel, siergras en luchtige beplanting.";
  return "Gebruik zonplekken voor bloei en halfschaduw voor rust, bladvolume en koelte.";
}

function createMonthlyAdvice(season: string, profile: GardenProfile, weather: ReturnType<typeof getWeatherProfile>) {
  const base = {
    lente: "Geef planten nu lucht en voeding; nieuwe groei reageert snel.",
    zomer: "Houd bloei fris met gericht water en lichte snoei.",
    herfst: "Ruim ziek blad op en laat sterke structuur staan.",
    winter: "Laat de tuin grotendeels rusten en bescherm potten."
  }[season];
  const context = profile.greenLevel === "Veel bestrating"
    ? "Randen langs bestrating drogen het eerst uit."
    : profile.sunProfile === "Veel schaduw"
      ? "In schaduw telt luchtigheid vaak meer dan extra water."
      : `Richt je vooral op ${profile.goal.toLowerCase()}.`;
  return `${base} ${context} ${weather.warning}`;
}

function createSmartInsight(plants: PlantAdvice[], weather: ReturnType<typeof getWeatherProfile>, profile: GardenProfile) {
  const plantNames = plants.map((plant) => plant.waarschijnlijke_plant).slice(0, 3).join(", ");
  const weatherPart = weather.isHotDry
    ? "Ochtendwater werkt deze week beter dan laat op de dag gieten."
    : weather.isWet
      ? "Meer lucht tussen planten is nu waardevoller dan extra water."
      : profile.greenLevel === "Veel bestrating"
        ? "De warme randen langs tegels verdienen een extra vochtcheck."
        : "Het weer geeft ruimte om bloei, vorm en bodem rustig bij te sturen.";
  return `${plantNames || "Je planten"} passen bij je wens: ${profile.goal.toLowerCase()}. ${weatherPart}`;
}

function createDemoCards(
  selectedPlants: Array<{ basePlant: string; plantName: string }>,
  plants: PlantAdvice[],
  month: number,
  weather: ReturnType<typeof getWeatherProfile>,
  profile: GardenProfile,
  location: { label: string; lat: number; lon: number } | null
) {
  const knownPlants = selectedPlants.filter((plant) => plant.basePlant !== "Nog niet zeker herkend");
  const plantOfMonth = choosePlantOfMonth(selectedPlants, month, weather);
  const biodiversityScore = calculateBiodiversityScore(selectedPlants, profile.goal);
  const bloomSoon = getBloomSoon(selectedPlants, month);
  const drought = getProfileDryness(profile, weather);
  const waterLevel: "laag" | "normaal" | "druk" = drought === "hoog" ? "druk" : weather.isWet || profile.sunProfile === "Veel schaduw" ? "laag" : "normaal";
  const trend: "stijgend" | "stabiel" | "dalend" = drought === "hoog" && profile.maintenance === "laag" ? "dalend" : knownPlants.length >= 3 || profile.goal === "Meer biodiversiteit" ? "stijgend" : "stabiel";

  return {
    tuinweer: {
      titel: weather.isHotDry ? "Warm en droog" : weather.isWet ? "Nat en opletten" : "Rustige tuinweek",
      tekst: `${weather.rain.toFixed(0)} mm regen, max. ${weather.maxTemp.toFixed(0)} graden. ${weather.isWet ? "Giet weinig." : weather.isHotDry ? "Water vroeg." : "Controleer potten."}`
    },
    plantVanDeMaand: {
      naam: plantOfMonth.plantName,
      actie: plants.find((plant) => plant.waarschijnlijke_plant === plantOfMonth.plantName)?.actie_deze_maand || "Controleer water, blad en groei."
    },
    tuinscoreTrend: {
      richting: trend,
      tekst: trend === "stijgend" ? "Je profiel en planten geven groeiruimte." : trend === "dalend" ? "Droogte vraagt deze week aandacht." : "Stabiel met rustig onderhoud."
    },
    waterdrukte: {
      niveau: waterLevel,
      tekst: waterLevel === "druk" ? "2-3 gietrondes deze week." : waterLevel === "normaal" ? "1-2 controles plannen." : "Regen doet veel werk."
    },
    binnenkortInBloei: bloomSoon,
    biodiversiteitScore: {
      score: biodiversityScore,
      tekst: biodiversityScore >= 75 ? "Sterk voor insecten." : biodiversityScore >= 50 ? "Redelijke basis." : "Voeg bloeiers toe."
    },
    liggingInschatting: createPositionEstimate(profile, selectedPlants, weather),
    slimmeAnalyse: createShortSmartAnalysis(selectedPlants, weather, profile),
    droogtestress: createDroughtStress(weather, profile),
    waterPerDag: createDailyWaterAdvice(selectedPlants, weather, profile),
    omgeving: createEnvironmentContext(location, selectedPlants, profile),
    tuinDna: createGardenDna(profile, selectedPlants, weather, biodiversityScore, bloomSoon)
  };
}

function choosePlantOfMonth(selectedPlants: Array<{ basePlant: string; plantName: string }>, month: number, weather: ReturnType<typeof getWeatherProfile>) {
  const blooming = selectedPlants.find((plant) => plantRules[plant.basePlant]?.bloomMonths.includes(month));
  if (blooming) return blooming;
  if (weather.isHotDry) {
    return selectedPlants.find((plant) => ["Hortensia", "Olifantsoor", "Roos"].includes(plant.basePlant)) || selectedPlants[0] || { basePlant: "Nog niet zeker herkend", plantName: "Je hoofdplant" };
  }
  return selectedPlants[0] || { basePlant: "Nog niet zeker herkend", plantName: "Je hoofdplant" };
}

function calculateBiodiversityScore(selectedPlants: Array<{ basePlant: string; plantName: string }>, goal: string) {
  const total = selectedPlants.reduce((score, plant) => score + (plantRules[plant.basePlant]?.biodiversity || 2), 0);
  const average = selectedPlants.length ? total / selectedPlants.length : 2;
  const diversityBonus = Math.min(new Set(selectedPlants.map((plant) => plant.basePlant)).size * 5, 20);
  const goalBonus = goal === "Meer biodiversiteit" ? 10 : 0;
  return Math.max(20, Math.min(95, Math.round(average * 14 + diversityBonus + goalBonus)));
}

function getBloomSoon(selectedPlants: Array<{ basePlant: string; plantName: string }>, month: number) {
  const nextMonths = [month, month + 1, month + 2].map((value) => ((value - 1) % 12) + 1);
  const plants = selectedPlants
    .filter((plant) => plantRules[plant.basePlant]?.bloomMonths.some((bloomMonth) => nextMonths.includes(bloomMonth)))
    .map((plant) => plant.plantName);
  return plants.length ? Array.from(new Set(plants)).slice(0, 4) : ["Nog geen duidelijke bloeiers"];
}

function createPositionEstimate(profile: GardenProfile, selectedPlants: Array<{ basePlant: string; plantName: string }>, weather: ReturnType<typeof getWeatherProfile>) {
  const hasSunLovers = selectedPlants.some((plant) => ["Lavendel", "Roos", "Siergras"].includes(plant.basePlant));
  const hasMoistureLovers = selectedPlants.some((plant) => ["Hortensia", "Olifantsoor"].includes(plant.basePlant));
  if (profile.sunProfile === "Veel schaduw") return "Schaduwrijke tuin; koeler en minder snel droog.";
  if (profile.greenLevel === "Veel bestrating") return weather.isHotDry ? "Warme, verharde randen drogen snel uit." : "Verharding geeft warmte en vraagt gerichte watercontrole.";
  if (hasSunLovers && hasMoistureLovers) return "Mix van zon en halfschaduw past bij deze planten.";
  if (hasSunLovers) return weather.isHotDry ? "Zonnig beeld; let op uitdroging." : "Veel zonminnende beplanting.";
  if (hasMoistureLovers) return "Half schaduw of vochtige plek logisch.";
  if (profile.goal === "Strakkere uitstraling") return "Geschikt voor duidelijke vakken en rustige lijnen.";
  return "Je profiel wijst op een gemengde tuin met ruimte voor seizoensaccenten.";
}

function createShortSmartAnalysis(selectedPlants: Array<{ basePlant: string; plantName: string }>, weather: ReturnType<typeof getWeatherProfile>, profile: GardenProfile) {
  const names = selectedPlants.map((plant) => plant.plantName).slice(0, 3).join(", ");
  const action = weather.isHotDry
    ? "zet water in de ochtend bovenaan"
    : weather.isWet
      ? "houd blad en bodem luchtig"
      : profile.goal === "Meer biodiversiteit"
        ? "laat bloei en schuilplekken bewust staan"
        : "focus op bloei en vorm";
  return `${names || "Je planten"} geven richting aan ${profile.goal.toLowerCase()}. Deze week: ${action}.`;
}

function createDroughtStress(weather: ReturnType<typeof getWeatherProfile>, profile: GardenProfile) {
  let score = 0;
  if (weather.maxTemp >= 28) score += 2;
  else if (weather.maxTemp >= 23) score += 1;
  if (weather.rain < 5) score += 2;
  else if (weather.rain < 15) score += 1;
  if (weather.evaporation > weather.rain + 10) score += 2;
  else if (weather.evaporation > weather.rain + 4) score += 1;
  if (weather.isSunny) score += 1;
  if (profile.greenLevel === "Veel bestrating") score += 1;
  if (profile.sunProfile === "Vooral middagzon") score += 1;
  if (profile.sunProfile === "Veel schaduw") score -= 1;

  const niveau: "laag" | "gemiddeld" | "hoog" = score >= 5 ? "hoog" : score >= 3 ? "gemiddeld" : "laag";
  return {
    niveau,
    uitleg: niveau === "hoog"
      ? "Warmte, weinig regen of verharding maken snelle controle belangrijk."
      : niveau === "gemiddeld"
        ? "Er is wat droogtedruk; controleer dorstige planten om de dag."
        : "Regen en temperatuur houden droogtestress beperkt."
  };
}

function createDailyWaterAdvice(selectedPlants: Array<{ basePlant: string; plantName: string }>, weather: ReturnType<typeof getWeatherProfile>, profile: GardenProfile) {
  const thirstyPlants = selectedPlants.filter((plant) => ["Hortensia", "Olifantsoor", "Roos", "Geranium"].includes(plant.basePlant)).length;
  const daily = weather.daily;
  if (!daily.length) {
    return Array.from({ length: 7 }, (_, index) => ({
      datum: `Dag ${index + 1}`,
      advies: "licht water geven" as const,
      reden: "Geen dagverwachting beschikbaar."
    }));
  }

  return daily.map((day, index) => {
    let pressure = 0;
    if (day.temp >= 27) pressure += 2;
    else if (day.temp >= 22) pressure += 1;
    if (day.rain < 1) pressure += 2;
    else if (day.rain < 4) pressure += 1;
    if (day.radiation >= 18) pressure += 1;
    if (thirstyPlants >= 2) pressure += 1;
    if (profile.greenLevel === "Veel bestrating") pressure += 1;
    if (profile.sunProfile === "Veel schaduw") pressure -= 1;
    if (profile.goal === "Minder onderhoud") pressure -= 1;

    const advies: "geen water nodig" | "licht water geven" | "extra water geven" = pressure >= 5 ? "extra water geven" : pressure >= 3 ? "licht water geven" : "geen water nodig";
    return {
      datum: formatDateLabel(day.date, index),
      advies,
      reden: `${day.temp.toFixed(0)} graden, ${day.rain.toFixed(0)} mm regen.`
    };
  });
}

function createEnvironmentContext(location: { label: string; lat: number; lon: number } | null, selectedPlants: Array<{ basePlant: string; plantName: string }>, profile: GardenProfile) {
  const hasUrbanPlants = selectedPlants.some((plant) => ["Buxus", "Beukenhaag", "Klimop"].includes(plant.basePlant));
  const type: "stedelijke tuin" | "groene omgeving" | "gemengd" = location && isLikelyUrban(location.label)
    ? "stedelijke tuin"
    : profile.greenLevel === "Vooral groen" || profile.goal === "Meer biodiversiteit"
      ? "groene omgeving"
      : "gemengd";
  const perceelgevoel = type === "stedelijke tuin"
    ? "Stenen, muren en schuttingen houden warmte langer vast."
    : type === "groene omgeving"
      ? "Groene randen zorgen vaker voor koelere avonden."
      : "Een mix van beschutting, border en verharding.";
  const nabijheid = hasUrbanPlants
    ? "Haag en klimmers geven beschutting en privacy."
    : profile.goal === "Meer biodiversiteit"
      ? "Bloei en schuilplekken maken de tuin aantrekkelijker voor bestuivers."
      : "De directe omgeving voelt bruikbaar voor een evenwichtige tuin.";

  return {
    type,
    perceelgevoel,
    nabijheid,
    kaartUrl: location ? createOsmTileUrl(location.lat, location.lon) : undefined
  };
}

function getProfileDryness(profile: GardenProfile, weather: ReturnType<typeof getWeatherProfile>): "laag" | "gemiddeld" | "hoog" {
  let score = weather.dryRisk === "hoog" ? 3 : weather.dryRisk === "middel" ? 2 : 1;
  if (profile.greenLevel === "Veel bestrating") score += 1;
  if (profile.sunProfile === "Vooral middagzon") score += 1;
  if (profile.sunProfile === "Veel schaduw") score -= 1;
  return score >= 4 ? "hoog" : score >= 2 ? "gemiddeld" : "laag";
}

function createGardenDna(
  profile: GardenProfile,
  selectedPlants: Array<{ basePlant: string; plantName: string }>,
  weather: ReturnType<typeof getWeatherProfile>,
  biodiversityScore: number,
  bloomSoon: string[]
) {
  const dryness = getProfileDryness(profile, weather);
  const hasMediterraneanPlants = selectedPlants.some((plant) => ["Lavendel", "Siergras", "Roos"].includes(plant.basePlant));
  const bloomPotential = bloomSoon[0] && bloomSoon[0] !== "Nog geen duidelijke bloeiers" ? "Veel seizoensbloei in aantocht" : "Rustige bloeifase deze maand";
  return [
    `${profile.gardenType}`,
    `${profile.sunProfile} met ${profile.greenLevel.toLowerCase()}`,
    dryness === "hoog" ? "Droogtegevoelig deze week" : dryness === "gemiddeld" ? "Gemiddeld droogtegevoelig" : "Koeler en minder dorstig",
    biodiversityScore >= 70 || profile.goal === "Meer biodiversiteit" ? "Sterke basis voor biodiversiteit" : "Biodiversiteit kan nog groeien",
    hasMediterraneanPlants || profile.goal === "Mediterrane uitstraling" ? "Mediterrane accenten passen goed" : bloomPotential
  ];
}

function isLikelyUrban(label: string) {
  return /amsterdam|rotterdam|den haag|utrecht|eindhoven|tilburg|groningen|almere|breda|nijmegen/i.test(label);
}

function createOsmTileUrl(lat: number, lon: number) {
  const zoom = 15;
  const x = Math.floor(((lon + 180) / 360) * 2 ** zoom);
  const y = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * 2 ** zoom);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

function formatDateLabel(value: string | undefined, index: number) {
  if (!value) return `Dag ${index + 1}`;
  return new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short" }).format(new Date(value));
}

function sum(values?: number[]) {
  return (values || []).reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function addScore(advice: GardenAdvice): GardenAdvice {
  const riskPenalty = advice.weeradvies.droogte_risico === "hoog" ? 14 : advice.weeradvies.droogte_risico === "middel" ? 7 : 2;
  const unknownPenalty = advice.planten.filter((plant) => plant.zekerheid === "laag").length * 3;
  const diversityBoost = Math.min(new Set(advice.planten.map((plant) => plant.waarschijnlijke_plant)).size * 2, 10);
  return {
    ...advice,
    tuinscore: Math.max(55, Math.min(96, 78 - riskPenalty - unknownPenalty + diversityBoost))
  };
}
