# Surdeigsprotokollen

Kalkulator og tidsplan for surdeigsbrød: bakerprosent, melblanding, levainbygg og en tidsplan fra levainen bygges torsdag kveld til brødet skjæres lørdag morgen.

**Live:** https://vincent-olsen.github.io/surdeigsprotokollen/

- **Oppskrift** — velg antall brød, gram mel per brød, hydrering, levain og salt. Seks meltyper i valgfri blanding, og anbefalt hydrering følger blandingen.
- **Tidsplan** — sett tre tidspunkter (levainbygg, vekkerklokke, skjæring). Resten regnes ut, og appen sier fra når avkjøling, kaldheving eller levainmodning havner utenfor det som fungerer.
- **Levain-forhold** — auto eller manuelt fra 1:1:1 til 1:10:10, med forklaring av hvordan forholdet styrer tid og syre.
- **Referanse** — hvorfor 98 °C ikke betyr ferdig, bakesvinn, deigtemperatur og hvordan du leser krummen.

Alt kjører i nettleseren. Ingen server, ingen database, ingen sporing.

## Kom i gang

Krever Node 22.12 eller nyere (`.nvmrc` peker på 24).

```sh
npm install
npm run dev          # http://localhost:5173
```

| Skript                  | Hva det gjør                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Utviklingsserver med hot reload                            |
| `npm run build`         | Produksjonsbygg til `dist/`                                |
| `npm run typecheck`     | `tsc --noEmit` i strict-modus                              |
| `npm test`              | Enhets- og integrasjonstester (Vitest)                     |
| `npm run test:coverage` | Samme, med dekningskrav på domenelaget                     |
| `npm run test:e2e`      | Playwright mot bygget app (kjør `npm run build` først)     |
| `npm run check`         | Alt over i samme rekkefølge som CI                         |

Første gang du kjører e2e lokalt: `npx playwright install chromium`.

## Arkitektur

```
index.html          statisk innhold og tomme containere for det dynamiske
src/
  domain/           rene funksjoner — ingen DOM, alt enhetstestet
    formula.ts      bakerprosent: hva du veier opp, og hvorfor
    flours.ts       meltyper, forhåndsvalg, blandingsstatistikk
    ratios.ts       levain-forhold og modningstider
    levain.ts       torsdagens bygg: hva du mikser, hva som går i deigen
    schedule.ts     tidsplan-løseren
    steps.ts        tidsplanen som steg med tekst og gram
    checks.ts       validering og råd
    recipe.ts       setter alt sammen: input → oppskrift
    time.ts         tidslinjen og formatering
  ui/               tynt lag som kobler DOM-en til domenet
  state.ts          standardverdier
e2e/                Playwright-tester og en statisk server som etterligner Pages
```

**Domenet vet ikke at det finnes en nettleser.** Hele oppskriften er en ren funksjon, `planRecipe(input) → Recipe`. UI-laget leser input, kaller den, og tegner resultatet på nytt. Det er noen mikrosekunder med aritmetikk, så det finnes ingen inkrementell oppdatering å holde synkron.

**Tid er ett tall.** Alle tidspunkter er minutter relativt til lørdag 00:00; torsdag 22:00 er −1560. Da blir tidsplanen addisjon, og dagskifter håndterer seg selv.

**Tidsplanen er overbestemt med vilje.** Tre faste tidspunkter over en kjede av faste varigheter går ikke opp av seg selv, så to ledd er elastiske: levainens modningstid (styrt av matingsforholdet) og kaldhevingen (10–18 t går fint). I auto-modus sikter løseren på 13 timer kaldheving og velger forholdet som kommer nærmest. Velger du forholdet selv, tar kaldhevingen hele differansen. Avkjøling kan bli lengre, men aldri kortere enn tre timer uten advarsel.

**Hydrering måles mot alt melet.** Også melet som ligger inne i levainen. Derfor er vannet du veier opp *ikke* melet du veier opp × hydreringen. Appen viser hele regnestykket, og testene låser det fast.

## Tester

- **Enhetstester** for hele domenelaget, inkludert invarianter over 1 620 kombinasjoner av input: summen av det du veier opp er alltid deigvekten, og vann i alt ÷ mel i alt er alltid hydreringen.
- **Integrasjonstester** som laster den ekte `index.html` inn i jsdom og klikker seg gjennom appen.
- **E2e-tester** i Chromium, desktop og mobil, mot det bygde resultatet servert under `/surdeigsprotokollen/` akkurat som GitHub Pages gjør. En feil `base` i `vite.config.ts` gir 404 på assets og røde tester, ikke en blank side i produksjon.

## Deploy

GitHub Actions kjører typecheck, tester, bygg og e2e på hver push og pull request. Push til `main` deployer til GitHub Pages.

Én gang: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Vite bygger med relativ `base` (`./`), så samme bygg fungerer på `vincent-olsen.github.io/surdeigsprotokollen/`, på et eget domene og lokalt. Det går fordi appen er én side uten klientside-ruting.

## Forutsetninger i modellen

- Starteren står på 100 % hydrering (like deler mel og vann).
- Modningstidene for levain gjelder ved ca. 21 °C. Åtte grader varmere halverer omtrent tiden; åtte grader kaldere dobler den.
- Absorpsjon og glutenstyrke per meltype er tommelfingerverdier for norsk mel, ikke laboratoriemålinger.
- Bulk forkortes med andelen sammalt mel, fra 5 t for helt siktet ned mot 3,5 t.
- Bakesvinn på 12–16 % regnes som ferdig stekt.
