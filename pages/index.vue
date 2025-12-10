<script setup lang="ts">
const { data, pending, error } = await useFetch('/api/carinthia')

const pageSize = ref(10)
const search = ref('')

// komplette Graph-Struktur
const graph = computed<any[]>(() => {
  const root: any = data.value || {}
  return Array.isArray(root['@graph']) ? root['@graph'] : []
})

// Hilfs-Maps: Orte & Kategorien nach ID
const placesById = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const node of graph.value) {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
    if (types.includes('Place')) {
      map[node['@id']] = node
    }
  }
  return map
})

const conceptsById = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const node of graph.value) {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
    if (types.includes('skos:Concept')) {
      map[node['@id']] = node
    }
  }
  return map
})

// nur Events aus dem Graph
const events = computed<any[]>(() => {
  return graph.value.filter((node: any) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']]
    return types.includes('Event') || types.includes('dcls:Event')
  })
})

// Suche über Name + Beschreibung (HTML wird entfernt)
const filteredEvents = computed(() => {
  if (!search.value) return events.value
  const term = search.value.toLowerCase()

  return events.value.filter((ev: any) => {
    const name = (ev.name || '').toLowerCase()
    const desc = stripHtml(ev.description || '').toLowerCase()
    return name.includes(term) || desc.includes(term)
  })
})

// sichtbare Events (Mehr-Button erweitert pageSize)
const visibleEvents = computed(() =>
  filteredEvents.value.slice(0, pageSize.value)
)

function loadMore() {
  pageSize.value += 10
}

// ---- Hilfsfunktionen für Darstellung ----

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + ' …'
}

function formatDate(value?: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatTime(value?: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return d.toLocaleTimeString('de-AT', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateRange(ev: any): string {
  const start = formatDate(ev.startDate)
  const end = formatDate(ev.endDate)

  if (start && end && start !== end) {
    return `${start} - ${end}`
  }
  if (start) return start
  return 'Datum: keine Angabe'
}

function formatTimeRange(ev: any): string {
  const start = formatTime(ev.startDate)
  const end = formatTime(ev.endDate)

  if (start && end && start !== end) {
    return `${start} - ${end} Uhr`
  }
  if (start) return `${start} Uhr`
  return 'Uhrzeit: keine Angabe'
}

function getVenue(ev: any): string {
  const locRef = Array.isArray(ev.location) ? ev.location[0]?.['@id'] : null
  if (!locRef) return 'Veranstaltungsort: keine Angabe'

  const place = placesById.value[locRef]
  const name = place?.name
  return name ? `Veranstaltungsort: ${name}` : 'Veranstaltungsort: keine Angabe'
}

function getCategories(ev: any): string {
  const cls = ev['dc:classification']
  if (!Array.isArray(cls) || cls.length === 0) return 'Kategorie: keine Angabe'

  const labels: string[] = []
  for (const c of cls) {
    const id = c?.['@id']
    if (!id) continue
    const concept = conceptsById.value[id]
    const label =
      concept?.prefLabel ||
      concept?.['skos:prefLabel'] ||
      concept?.name ||
      null
    if (label) labels.push(label)
  }
  if (labels.length === 0) return 'Kategorie: keine Angabe'
  return 'Kategorie: ' + labels.join(', ')
}

function getImageUrl(ev: any): string | null {
  const images = ev.image
  if (!Array.isArray(images) || images.length === 0) return null
  const img = images[0]
  return (
    img.thumbnailUrl ||
    img['dc:dynamicDefaultUrl'] ||
    img.contentUrl ||
    img['dc:webUrl'] ||
    null
  )
}

function getDetailsUrl(ev: any): string | null {
  // Falls es eine Web-URL geben sollte (oft über slug + Basis-URL),
  // kannst du das hier anpassen. Fürs Erste nur Platzhalter:
  return null
}

// Titelzeile für Event (Name)
function getTitle(ev: any): string {
  return ev.name || 'Ohne Titel'
}

// Kurzbeschreibung
function getShortDescription(ev: any): string {
  const text = stripHtml(ev.description || '')
  if (!text) return ''
  return truncate(text, 260)
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="site-header">
      <div class="header-inner">
        <div class="branding">
          <div class="branding-title">
            Veranstaltungsdatenbank Kärnten
          </div>
          <div class="branding-sub">
            Die Plattform für Ihr Event
          </div>
        </div>

        <nav class="main-nav" aria-label="Hauptnavigation">
          <ul>
            <li><button type="button">Musik</button></li>
            <li><button type="button">Theater &amp; Tanz</button></li>
            <li><button type="button">Literatur</button></li>
            <li><button type="button">Festivals &amp; Feste</button></li>
            <li><button type="button">Ausstellungen</button></li>
            <li><button type="button">Kinder &amp; Jugend</button></li>
            <li><button type="button" class="primary">
              Event eintragen
            </button></li>
          </ul>
        </nav>
      </div>
    </header>

    <!-- Hauptinhalt -->
    <main class="site-main">
      <!-- Hero -->
      <section class="hero">
        <h1>Veranstaltungen in Kärnten</h1>
        <p>Das vielfältige Kulturangebot im Süden.</p>
      </section>

      <!-- Suchleiste -->
      <section class="filters">
        <label class="search-label">
          <span>Suche</span>
          <input
            v-model="search"
            type="search"
            placeholder="Nach Titel oder Beschreibung suchen …"
          />
        </label>
      </section>

      <!-- Events -->
      <section class="events">
        <div v-if="pending" class="status">
          Veranstaltungen werden geladen …
        </div>

        <div v-else-if="error" class="status status-error">
          Fehler beim Laden der Veranstaltungen.
        </div>

        <ul
          v-else
          class="event-list"
        >
          <li
            v-for="ev in visibleEvents"
            :key="ev['@id']"
            class="event-card"
          >
            <div class="event-image" v-if="getImageUrl(ev)">
              <img
                :src="getImageUrl(ev)!"
                :alt="getTitle(ev)"
                loading="lazy"
              />
            </div>

            <div class="event-content">
              <h2 class="event-title">
                {{ getTitle(ev) }}
              </h2>

              <div class="event-meta">
                <div>
                  <strong>Datum:</strong>
                  {{ formatDateRange(ev) }}
                </div>
                <div>
                  <strong>Uhrzeit:</strong>
                  {{ formatTimeRange(ev) }}
                </div>
                <div>
                  {{ getVenue(ev) }}
                </div>
                <div>
                  {{ getCategories(ev) }}
                </div>
              </div>

              <p
                v-if="getShortDescription(ev)"
                class="event-description"
              >
                {{ getShortDescription(ev) }}
              </p>

              <div class="event-actions">
                <a
                  v-if="getDetailsUrl(ev)"
                  :href="getDetailsUrl(ev)!"
                  class="details-link"
                >
                  Details
                </a>
                <button
                  v-else
                  type="button"
                  class="details-link details-link--disabled"
                >
                  Details
                </button>
              </div>
            </div>
          </li>
        </ul>

        <div
          v-if="!pending && !error && visibleEvents.length === 0"
          class="status"
        >
          Keine Veranstaltungen gefunden.
        </div>

        <div
          v-if="visibleEvents.length < filteredEvents.length"
          class="load-more-wrapper"
        >
          <button
            type="button"
            class="load-more"
            @click="loadMore"
          >
            Mehr
          </button>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-block">
          <div class="footer-title">
            Amt der Kärntner Landesregierung
          </div>
          <div>Abteilung 14 – Kunst und Kultur</div>
          <div>Burggasse 8 · 9021 Klagenfurt am Wörthersee</div>
          <div>+43 (0) 50 536 – 34006</div>
          <div>abt14.post@ktn.gv.at</div>
        </div>
        <div class="footer-links">
          <a href="#">Impressum</a>
          <a href="#">Datenschutzerklärung</a>
          <a href="#">Barrierefreiheit</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f6f6;
  color: #222;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

/* Header */

.site-header {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.branding-title {
  font-weight: 700;
  font-size: 1.1rem;
}

.branding-sub {
  font-size: 0.85rem;
  color: #666;
}

.main-nav ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
}

.main-nav button {
  border: none;
  background: transparent;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
}

.main-nav button:hover {
  border-color: #ddd;
  background: #fafafa;
}

.main-nav button.primary {
  background: #c8102e;
  color: #fff;
  border-color: #c8102e;
}

/* Main */

.site-main {
  flex: 1;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem 1rem 2rem;
}

/* Hero */

.hero h1 {
  font-size: 1.8rem;
  margin: 0 0 0.25rem;
}

.hero p {
  margin: 0;
  color: #555;
}

/* Suche */

.filters {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.search-label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 420px;
}

.search-label span {
  font-size: 0.9rem;
  font-weight: 600;
}

.search-label input {
  border-radius: 999px;
  border: 1px solid #ccc;
  padding: 0.5rem 0.9rem;
  font-size: 0.9rem;
}

/* Eventliste */

.events {
  margin-top: 0.5rem;
}

.status {
  padding: 1rem 0;
  font-size: 0.95rem;
  color: #555;
}

.status-error {
  color: #b00020;
}

.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
  background: #ffffff;
  border-radius: 10px;
  padding: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.event-image img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 8px;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.event-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.event-meta {
  font-size: 0.85rem;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.event-description {
  font-size: 0.9rem;
  color: #333;
  margin: 0.25rem 0 0;
}

.event-actions {
  margin-top: 0.5rem;
}

.details-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-decoration: none;
  border: 1px solid #c8102e;
  color: #c8102e;
  background: #fff;
  cursor: pointer;
}

.details-link:hover {
  background: #c8102e;
  color: #fff;
}

.details-link--disabled {
  opacity: 0.5;
  cursor: default;
}

/* Mehr-Button */

.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1.2rem;
}

.load-more {
  border-radius: 999px;
  border: 1px solid #ccc;
  background: #fff;
  padding: 0.5rem 1.3rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.load-more:hover {
  background: #f0f0f0;
}

/* Footer */

.site-footer {
  border-top: 1px solid #e0e0e0;
  background: #ffffff;
  margin-top: 1rem;
}

.footer-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.footer-title {
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-links a {
  color: #555;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}

/* Responsive */

@media (min-width: 768px) {
  .event-card {
    grid-template-columns: 220px minmax(0, 1fr);
    align-items: stretch;
  }

  .event-image img {
    height: 100%;
    max-height: none;
  }
}
</style>
