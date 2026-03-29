import type { APIRoute } from 'astro'
import { fetchAllFeeds } from '../lib/feeds'

export const prerender = false

export const GET: APIRoute = async () => {
  const { posts, fetchedAt } = await fetchAllFeeds()

  const items = posts.slice(0, 50).map(p => {
    const pubDate = p.date instanceof Date ? p.date : new Date(p.date)
    const safeTitle   = p.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeExcerpt = p.excerpt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeUrl     = p.url.replace(/&/g, '&amp;')
    return `
    <item>
      <title>${safeTitle}</title>
      <link>${safeUrl}</link>
      <guid isPermaLink="true">${safeUrl}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <author>${p.feedName.replace(/&/g, '&amp;')}</author>
      <description>${safeExcerpt}</description>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Permit-Any-Any — Network Automation &amp; DevNetOps</title>
    <link>https://permit-any-any.com</link>
    <description>Curated network automation, DevNetOps, and cybersecurity blog feed aggregator for network engineers.</description>
    <language>en-us</language>
    <lastBuildDate>${fetchedAt.toUTCString()}</lastBuildDate>
    <atom:link href="https://permit-any-any.com/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=21600', // 6 hours — matches feed cache TTL
    },
  })
}
