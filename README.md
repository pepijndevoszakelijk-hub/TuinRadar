# TuinRadar

Premium demo-MVP voor Nederlands tuinadvies op basis van adres, foto's, Pl@ntNet-herkenning, PDOK-geocoding, Open-Meteo weerdata en lokale verzorgingsregels.

## Lokaal draaien

1. Installeer dependencies:

```bash
npm install
```

2. Maak `.env.local` aan:

```bash
PLANTNET_API_KEY=
```

Vul hier je eigen Pl@ntNet key in als je automatische plantsuggesties wilt. Zonder key blijft de app werken en kun je zelf de plantnaam kiezen.

3. Start de app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Vercel deploy

1. Push dit project naar GitHub.
2. Maak in Vercel een nieuw project aan en kies deze GitHub-repository.
3. Gebruik de standaard Next.js instellingen.
4. Voeg bij **Settings -> Environment Variables** toe:

```bash
PLANTNET_API_KEY=je_plantnet_key
```

5. Deploy. Daarna kan je vriend de app openen via de publieke Vercel-link.

## Belangrijk

- Geen OpenAI.
- Geen database of login.
- Geen betaalde API's.
- PDOK en Open-Meteo werken zonder key.
- Pl@ntNet is optioneel; zonder key blijft de handmatige plantkeuze beschikbaar.

## Scripts

```bash
npm run dev
npm run build
npm run start
```
