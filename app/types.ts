export type PlantAdvice = {
  foto: string;
  waarschijnlijke_plant: string;
  zekerheid: "laag" | "middel" | "hoog" | "zelf" | "onzeker";
  gezondheid: string;
  water: string;
  snoei: string;
  actie_deze_maand: string;
  opmerking: string;
};

export type PlantSuggestion = {
  naam: string;
  wetenschappelijkeNaam: string;
  score: number;
};

export type PlantIdentification = {
  fotoIndex: number;
  suggesties: PlantSuggestion[];
  foutmelding?: string;
};

export type GardenAdvice = {
  tuinprofiel: {
    samenvatting: string;
    ligging_inschatting: string;
    zon_schaduw: string;
    risico: string;
  };
  weeradvies: {
    samenvatting: string;
    wateradvies_7_dagen: string;
    droogte_risico: string;
  };
  planten: PlantAdvice[];
  prioriteiten: string[];
  maandadvies: string;
  wow_samenvatting: string;
  tuinscore?: number;
  bronnen?: {
    pdok?: boolean;
    openMeteo?: boolean;
    advies?: boolean;
  };
  demo?: {
    tuinweer: {
      titel: string;
      tekst: string;
    };
    plantVanDeMaand: {
      naam: string;
      actie: string;
    };
    tuinscoreTrend: {
      richting: "stijgend" | "stabiel" | "dalend";
      tekst: string;
    };
    waterdrukte: {
      niveau: "laag" | "normaal" | "druk";
      tekst: string;
    };
    binnenkortInBloei: string[];
    biodiversiteitScore: {
      score: number;
      tekst: string;
    };
    liggingInschatting: string;
    slimmeAnalyse: string;
    droogtestress: {
      niveau: "laag" | "gemiddeld" | "hoog";
      uitleg: string;
    };
    waterPerDag: Array<{
      datum: string;
      advies: "geen water nodig" | "licht water geven" | "extra water geven";
      reden: string;
    }>;
    omgeving: {
      type: "stedelijke tuin" | "groene omgeving" | "gemengd";
      perceelgevoel: string;
      nabijheid: string;
      kaartUrl?: string;
    };
    tuinDna?: string[];
  };
};

export type AnalyzeResponse = GardenAdvice & {
  locatie?: {
    adres: string;
    lat?: number;
    lon?: number;
  };
};
