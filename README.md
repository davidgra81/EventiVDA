# 🏔️ EventiVDA — Eventi, Rassegne e Attività in Valle d'Aosta

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/davidgra81/EventiVDA)

**EventiVDA** è il portale interattivo per scoprire tutti gli eventi, le rassegne (inclusa la **Saison Culturelle**), le mostre, le sagre e le attività in **Valle d'Aosta**, con:
- **Cartina Interattiva dei 74 Comuni della Valle d'Aosta** (confini comunali ufficiali ISTAT) con pin eventi cliccabili e filtro per Comune o Valle (*Alta Valle*, *Aosta*, *Media Valle*, *Bassa Valle*).
- **Motore di Scraping Multi-Fonte Automatico** (LoveVDA, Saison Culturelle, Forte di Bard, Google News VdA, AostaSera).
- **Ricerca Temporale Focalizzata sui Prossimi 30 Giorni** (*Oggi*, *Domani*, *Questo Weekend*, *Nei Weekend*, *Prossimi 30 Giorni*, *Anche Oltre 30gg*).
- **3 Modalità di Visualizzazione**:
  1. **Card** (Griglia fotografica)
  2. **Elenco** (Compatto con data e dettagli rapidi)
  3. **Timeline Bolle** (Linea temporale centrale morbida a curve sinuose con bolle flottanti alternate a destra e sinistra e dimensionate per importanza).

---

## 🚀 Avvio Locale

```bash
node server.js
```
Apri nel browser: `http://localhost:8000`

---

## 🌐 Pubblicazione su Render (`onrender.com`)

Il repository include già `render.yaml` e `package.json` configurati per Render:
1. Clicca su **[Deploy to Render](https://render.com/deploy?repo=https://github.com/davidgra81/EventiVDA)** (oppure da Render Dashboard -> **New +** -> **Web Service** / **Blueprint** -> seleziona il repository `davidgra81/EventiVDA`).
2. Render rileverà automaticamente `render.yaml` (`buildCommand: npm install`, `startCommand: npm start`) e pubblicherà il sito su `https://eventivda.onrender.com`.
