# Piano di Implementazione - Mappa Geografica Leaflet, CMS Comuni e Fix Scraper

Questo documento delinea l'integrazione di una vera mappa geografica Leaflet.js della Valle d'Aosta con i suoi comuni, il ripristino dei filtri a discesa, la correzione del blocco scraper interrotto e il caricamento di immagini da file locale.

## User Review Required

> [!IMPORTANT]
> **Nuova Mappa Geografica Leaflet.js:** Sostituiremo la mappa SVG con una mappa geografica Leaflet.js reale incentrata sulla Valle d'Aosta. La mappa supporterà dinamicamente i temi chiaro/scuro cambiando i tile server (CartoDB Light/Dark) all'attivazione del tema. Gli eventi saranno geo-localizzati con coordinate geografiche reali (Latitudine/Longitudine).
>
> **Gestione Raggruppamento Comuni in Area (Admin CMS):** Creeremo un database in localStorage (`vda_comuni`) per gestire i Comuni e la loro associazione alle aree (Alta, Media, Bassa Valle, Aosta). L'amministratore avrà una nuova scheda **"Comuni & Zone"** per modificare l'area geografica di ciascun comune tramite un elenco a discesa, o per aggiungere nuovi comuni con relative coordinate reali.

> [!TIP]
> **Filtri a Discesa (Dropdown):** Come richiesto, i filtri di Categoria e Area torneranno ad essere eleganti menu a discesa (dropdown) invece di pills.
>
> **Caricamento Immagine da File:** Nei moduli di creazione e modifica eventi admin, aggiungeremo un input File. L'immagine selezionata verrà letta tramite `FileReader` in Base64 Data URL, consentendo il salvataggio persistente nel localStorage dell'utente.

## Proposed Changes

---

### [Componente Database & Coordinate Geografiche]

#### [MODIFY] [data.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/vda-events-hub/data.js)
- Aggiunta di latitudine/longitudine reali (`lat`, `lng`) a tutti gli eventi iniziali.
- Inizializzazione della tabella dei Comuni (`vda_comuni`) in `initializeStorage()` contenente i comuni principali e la loro associazione di default all'area (Alta/Media/Bassa/Aosta).

---

### [Componente Frontend & Layout (Leaflet, CMS & Form)]

#### [MODIFY] [index.html](file:///C:/Users/Acer/.gemini/antigravity/scratch/vda-events-hub/index.html)
- **Importazione Leaflet:** Aggiunta dei CDN di Leaflet CSS e JS nella sezione `<head>`.
- **Filtri di Ricerca:** Sostituzione dei filtri a pills con i dropdown `<select>` tradizionali per Categoria e Zona/Area.
- **Mappa Geografica:** Sostituzione del tag `<svg id="vdaSvgMap">` con un contenitore div `#vdaLeafletMap` per l'aggancio di Leaflet.
- **CMS Admin:**
  - Aggiunta della scheda tab **"Comuni & Zone"** (`panelComuni`) nella navigazione admin.
  - Creazione del layout per la gestione dei comuni (tabella di modifica associazione area e form per aggiungere nuovi comuni).
- **Modali Evento:**
  - Inserimento del campo di caricamento file `<input type="file" id="editEvtFile">` (e `addEvtFile`) per caricare foto da locale.
  - Potenziamento della toolbar di formattazione descrizione con pulsanti per titoli (`<h3>`) ed evidenziazioni di testo.

#### [MODIFY] [style.css](file:///C:/Users/Acer/.gemini/antigravity/scratch/vda-events-hub/style.css)
- Rimozione degli stili associati all'SVG `#vdaSvgMap`.
- Aggiunta dello stile per `#vdaLeafletMap` (altezza fissa, arrotondamento angoli).
- Styling per la nuova scheda amministrativa di gestione comuni (tabelle ed input).

#### [MODIFY] [app.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/vda-events-hub/app.js)
- **Leaflet Map:**
  - Inizializzazione di Leaflet in `initMap()` centrato su Aosta con livello di zoom 10.
  - Funzione `updateMapTileLayer()` per cambiare la sorgente mappa (chiara/scura) in base al tema selezionato.
  - Funzione `renderMapMarkers(filtered)` per plottare cerchi marker Leaflet con dimensioni proporzionali all'importanza e popup dettagliati.
- **Fix Scraper:** Ripristino della chiusura della funzione `runScraper()`, che salva correttamente gli eventi estratti in coda di moderazione.
- **Dropdown Filters:** Aggiornamento delle funzioni di filtraggio per raccogliere i valori dai select ed implementare il filtro di area recuperando i comuni associati alla zona selezionata.
- **CMS Comuni & Aree:**
  - Funzioni per mostrare l'elenco dei comuni ed aggiornare la loro associazione ad un'area.
  - Generazione dinamica dei select di Comuni nei form di inserimento/modifica evento, in modo che l'area geografica sia dedotta dinamicamente dal comune scelto.
- **File Upload:** Integrazione di `initImageUpload()` per convertire i file immagine locali in stringhe Base64 e memorizzarle.
- **Esposizione API:** Esportazione delle nuove funzioni di modifica comuni e caricamento file.

---

### [Componente Scraper Simulator]

#### [MODIFY] [scraper.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/vda-events-hub/scraper.js)
- Aggiornamento degli eventi del Cactus Film Festival con coordinate reali (`lat`, `lng`).

---

## Verification Plan

### Automated Tests
- Avvio dell'applicazione a livello locale e controllo console JS.

### Manual Verification
1. **Verifica Mappa Leaflet:** Aprire la pagina principale e verificare che la mappa Leaflet sia inizializzata. Cliccare sui marker e verificare il popup. Cambiare tema e controllare che i tiles passino da chiari a scuri.
2. **Verifica Dropdown Filtri:** Filtrare per "Musica" o per "Bassa Valle" usando i select e controllare che la lista eventi e i marker sulla mappa si aggiornino.
3. **Verifica Scraper:** Eseguire lo scraper dall'admin e verificare che i log terminino con successo e che gli eventi vengano accodati in moderazione.
4. **Verifica CMS Comuni:** Nell'admin, sotto la scheda "Comuni", cambiare l'area di "Cogne" da *Media Valle* a *Alta Valle*. Verificare che gli eventi di Cogne compaiano ora filtrando per *Alta Valle*.
5. **Verifica Caricamento Immagine:** Creare o modificare un evento, caricare un'immagine dal computer tramite il pulsante Sfoglia e salvare. Verificare che l'immagine base64 si carichi nel catalogo pubblico.
