// server/api/carinthia.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const method = getMethod(event);
  let endpoint: string | undefined;
  let filter: Record<string, any> | undefined;

  if (method === 'POST') {
    const body = await readBody<{
      endpoint?: string;
      filter?: Record<string, any>;
    }>(event);
    endpoint = body?.endpoint;
    filter = body?.filter;
  } else {
    const query = getQuery(event);
    endpoint = (query.endpoint as string) || undefined;
    // bei GET testen wir ohne Filter
    filter = {};
  }

  endpoint = endpoint || config.public?.carinthiaDefaultEndpoint;

  if (!endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing endpoint (provide endpoint in request or set NUXT_CARINTHIA_ENDPOINT)'
    });
  }

  // Ensure we have a usable base URL. Prefer runtime config public value, fallback to default.
  const baseUrl = config.public?.carinthiaBaseUrl || 'https://data.carinthia.com';

  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Carinthia base URL is not configured (set NUXT_CARINTHIA_BASE_URL)'
    });
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/v4/endpoints/${endpoint}`;

  try {
    const result = await $fetch(url, {
      method: 'POST',
      body: {
        token: config.carinthiaToken,
        filter: filter || {}
      }
    });

    return result;
  } catch (err: any) {
    console.error('Carinthia API error:', err);
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || 'Carinthia API failed'
    });
  }
});
