# Sikkerhet

Surdeigsprotokollen er en statisk side. Alt regnes ut i nettleseren; det finnes ingen server, ingen database, ingen innlogging og ingen brukerdata. Det som støttes, er det som ligger på `main` og på https://vincent-olsen.github.io/surdeigsprotokollen/.

## Rapportere en sårbarhet

Ikke opprett et offentlig issue. Bruk **[Report a vulnerability](https://github.com/vincent-olsen/surdeigsprotokollen/security/advisories/new)** under Security-fanen, så går rapporten privat til vedlikeholderen.

Ta med hva du fant, hvordan det kan gjenskapes, og hva en angriper kan oppnå.

*English: please report vulnerabilities privately via the link above, not in a public issue.*

## Det som er på plass

- Content-Security-Policy i det bygde `index.html`, med Trusted Types: bare egne skript, ingen inline-skript eller -stil, ingen `innerHTML`.
- Ingen npm-pakker i produksjonsbygget; alt fra npm er utviklingsverktøy.
- GitHub Actions er låst til commit-SHA, og jobbene har minst mulig tilganger.
- Dependabot for npm og Actions, secret scanning med push protection.
