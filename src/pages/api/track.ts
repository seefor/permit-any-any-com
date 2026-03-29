import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals.runtime?.env as Record<string, unknown>)?.DB as D1Database | undefined
  if (!db) {
    return new Response('DB not available', { status: 503 })
  }

  let body: { url?: string; title?: string; feedName?: string; feedColor?: string }
  try {
    body = await request.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { url, title, feedName, feedColor } = body
  if (!url || !title || !feedName) {
    return new Response('Missing fields', { status: 400 })
  }

  await db
    .prepare(
      `INSERT INTO article_clicks (url, title, feed_name, feed_color, clicks, last_clicked)
       VALUES (?, ?, ?, ?, 1, ?)
       ON CONFLICT(url) DO UPDATE SET
         clicks = clicks + 1,
         last_clicked = excluded.last_clicked`
    )
    .bind(url, title, feedName, feedColor ?? '#888', new Date().toISOString())
    .run()

  return new Response(null, { status: 204 })
}
