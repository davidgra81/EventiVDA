# Checklist Attività - Valle d'Aosta Events Hub (Nuove Funzionalità Leaflet, CMS Comuni & Foto Upload)

- [x] **Integrazione Mappa Geografica Leaflet.js:**
  - [x] Aggiunto CDN Leaflet in `<head>` di `index.html`.
  - [x] Rimpiazzato contenitore SVG con div `#vdaLeafletMap`.
  - [x] Inizializzata la mappa Leaflet centrata sulla Valle d'Aosta (zoom 10) in `app.js`.
  - [x] Configurato caricamento dinamico delle tiles in base al tema chiaro/scuro (CartoDB Light/Dark).
  - [x] Configurato rendering di cerchi marker dinamici basati su importanza e livello di sponsorizzazione.
  - [x] Personalizzati i popup dei marker per allinearsi ai fogli di stile del portale.

- [x] **CMS Gestione Raggruppamento Comuni:**
  - [x] Definito database Comuni (`vda_comuni` in `localStorage`).
  - [x] Creata scheda admin **"Comuni & Zone"** in `index.html`.
  - [x] Implementata visualizzazione tabella dei comuni con latitudine/longitudine e associazione area modificabile in tempo reale.
  - [x] Sviluppato form per inserimento di nuovi comuni.
  - [x] Sostituito input testo Comune con select dropdown (`editEvtLocation` / `addEvtLocation`) autocompilata.
  - [x] Collegata selezione comune ad autocalcolo area geografica.

- [x] **Caricamento Foto da File locale:**
  - [x] Aggiunto input file nei modali di modifica e creazione.
  - [x] Implementata lettura file tramite `FileReader` in Base64 Data URL.
  - [x] Collegato salvataggio stringa Base64 nel database eventi in `localStorage`.

- [x] **Correzione Event Scraper:**
  - [x] Sistemato bug nel callback di completamento del timer dello scraper.
  - [x] Aggiunto trigger per aggiornare la tabella di moderazione eventi admin in tempo reale (`renderModerationPanel()`).

- [x] **Editor Descrizione Avanzato:**
  - [x] Ampliata toolbar WYSIWYG con pulsanti per titoli (`<h3>`) ed evidenziazioni di testo.
  - [x] Aggiunto stile CSS per la classe `.wysiwyg-highlight`.

- [x] **Ripristino Dropdown Filtri Pubblici:**
  - [x] Sostituite le pills con select dropdown per filtri Categoria e Area.
  - [x] Integrato panning automatico della mappa all'area selezionata dal menu.
