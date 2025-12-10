// server/api/carinthia.get.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const baseUrl = 'https://data.carinthia.com/api/v4/endpoints/557ea81f-6d65-6476-9e01-d196112514d2'
  const token = config.carinthiaToken || process.env.NUXT_CARINTHIA_TOKEN

  if (!token) {
    console.error('[Carinthia] Token fehlt')
    throw createError({
      statusCode: 500,
      statusMessage: 'Carinthia API ist nicht konfiguriert (Token fehlt).'
    })
  }

  const url = `${baseUrl}?include=image&token=${token}`

  console.log('[Carinthia] Request →', url)

  try {
    const data = await $fetch(url, { method: 'GET' })
    return data
  } catch (err: any) {
    console.error('[Carinthia] Fehler:', err?.data || err?.message || err)
    throw createError({
      statusCode: 502,
      statusMessage: 'Fehler beim Abrufen der Veranstaltungsdaten von der Carinthia-API.'
    })
  }
})
