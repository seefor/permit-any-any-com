import { XMLParser } from 'fast-xml-parser'
import { parse as parseYaml } from 'yaml'
import feedsYaml from '../data/feeds.yaml?raw'

export interface FeedConfig {
  name: string
  url: string
  color: string
}

export interface PostItem {
  title: string
  url: string
  author: string
  date: Date
  excerpt: string
  feedColor: string
  feedName: string
  imageUrl: string   // empty string if none found
}

// Load feeds from the YAML bundled at build time via Vite's ?raw import
function loadFeeds(): FeedConfig[] {
  const data = parseYaml(feedsYaml) as { feeds: FeedConfig[] }
  return data.feeds.map(f => ({
    name:  String(f.name).trim(),
    url:   String(f.url).trim(),
    color: String(f.color).trim(),
  }))
}

export const FEEDS: FeedConfig[] = loadFeeds()

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeString(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    return String(obj['#text'] ?? obj['_'] ?? '')
  }
  return String(val ?? '')
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    // strip residual Markdown syntax
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) → text
    .replace(/https?:\/\/\S+/g, '')            // bare URLs
    .replace(/#{1,6}\s/g, '')                  // ## headings
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')  // *italic* / **bold**
    .replace(/`[^`]+`/g, '')                   // `code`
    .replace(/\s+/g, ' ').trim()
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trimEnd() + '…'
}

function extractAtomLink(linkVal: unknown): string {
  if (!linkVal) return ''
  if (typeof linkVal === 'string') return linkVal
  if (Array.isArray(linkVal)) {
    const alt = (linkVal as Record<string, unknown>[]).find(
      l => l['@_rel'] === 'alternate' || !l['@_rel']
    )
    return String((alt ?? linkVal[0])?.['@_href'] ?? '')
  }
  const obj = linkVal as Record<string, unknown>
  return String(obj['@_href'] ?? obj['#text'] ?? '')
}

/**
 * Extract the best available image URL from an RSS <item> or Atom <entry>.
 * Priority: media:content → media:thumbnail → enclosure → first <img> in HTML content
 */
function extractImage(item: Record<string, unknown>): string {
  // 1. media:content (WordPress, YouTube, etc.)
  const mc = item['media:content']
  if (mc) {
    const node = Array.isArray(mc) ? mc[0] : mc
    const url = safeString((node as Record<string, unknown>)?.['@_url'] ?? '')
    if (url && isImageUrl(url)) return url
  }

  // 2. media:thumbnail
  const mt = item['media:thumbnail']
  if (mt) {
    const node = Array.isArray(mt) ? mt[0] : mt
    const url = safeString((node as Record<string, unknown>)?.['@_url'] ?? '')
    if (url && isImageUrl(url)) return url
  }

  // 3. enclosure with image MIME type
  const enc = item.enclosure
  if (enc) {
    const node = (Array.isArray(enc) ? enc[0] : enc) as Record<string, unknown>
    const mime = safeString(node['@_type'] ?? '')
    const url  = safeString(node['@_url'] ?? '')
    if (url && mime.startsWith('image/')) return url
  }

  // 4. First <img src="..."> inside content:encoded or description
  const html = safeString(item['content:encoded'] ?? item.description ?? item.content ?? '')
  const imgMatch = html.match(/<img[^>]+src=["']([^"'>\s]+)["']/i)
  if (imgMatch?.[1] && isImageUrl(imgMatch[1])) return imgMatch[1]

  return ''
}

function isImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    // Reject emoji CDNs and tiny icon images — these render as ~72px squares in cards
    if (u.hostname === 's.w.org') return false
    if (u.pathname.includes('/emoji/')) return false
    if (u.pathname.includes('/smilies/')) return false
    if (u.hostname.includes('gravatar.com')) return false // avatars, not article images
    // Accept anything that looks like an image path or a known image CDN
    return (
      /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(u.pathname) ||
      u.hostname.includes('wp.com') ||
      u.hostname.includes('cloudinary') ||
      u.hostname.includes('unsplash') ||
      u.hostname.includes('images.') ||
      u.hostname.includes('img.')
    )
  } catch {
    return false
  }
}

// ── Feed URL enrichment ───────────────────────────────────────────────────────
// Request more items than the default (10) where the feed platform supports it.

function enrichUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)

    // WordPress self-hosted & WordPress.com: ?posts_per_rss=50
    if (u.pathname.includes('/feed') || u.pathname.endsWith('/rss/')) {
      if (!u.searchParams.has('posts_per_rss') && !u.searchParams.has('count')) {
        u.searchParams.set('posts_per_rss', '50')
      }
      return u.toString()
    }

    // Blogger: ?max-results=50
    if (u.hostname.includes('blogspot.com') || u.pathname.includes('/feeds/posts')) {
      if (!u.searchParams.has('max-results')) {
        u.searchParams.set('max-results', '50')
      }
      return u.toString()
    }
  } catch { /* ignore malformed URLs */ }
  return rawUrl
}

// ── Feed fetcher ──────────────────────────────────────────────────────────────

async function fetchFeed(feed: FeedConfig): Promise<PostItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000) // slightly longer for larger payloads

  try {
    const res = await fetch(enrichUrl(feed.url), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'permit-any-any/1.0 RSS reader',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return []

    const xml = await res.text()
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      allowBooleanAttributes: true,
    })
    const parsed = parser.parse(xml)
    const items: PostItem[] = []

    // ── RSS 2.0 ──────────────────────────────────────────────────────────────
    const rssItems = parsed?.rss?.channel?.item
    if (rssItems) {
      const arr: unknown[] = Array.isArray(rssItems) ? rssItems : [rssItems]
      for (const raw of arr) {
        const item = raw as Record<string, unknown>
        const title = stripHtml(safeString(item.title))
        const link  = safeString(item.link || (item.guid as Record<string,unknown>)?.['#text'] || item.guid)
        const desc  = safeString(item['content:encoded'] || item.description || '')
        const dateStr = safeString(item.pubDate || item['dc:date'] || '')
        if (!title || !link) continue

        items.push({
          title,
          url:       link,
          author:    feed.name,
          date:      dateStr ? new Date(dateStr) : new Date(0),
          excerpt:   truncate(stripHtml(desc), 400),
          feedColor: feed.color,
          feedName:  feed.name,
          imageUrl:  extractImage(item),
        })
      }
    }

    // ── Atom ─────────────────────────────────────────────────────────────────
    const atomEntries = parsed?.feed?.entry
    if (atomEntries) {
      const arr: unknown[] = Array.isArray(atomEntries) ? atomEntries : [atomEntries]
      for (const raw of arr) {
        const entry = raw as Record<string, unknown>
        const title   = stripHtml(safeString(entry.title))
        const link    = extractAtomLink(entry.link)
        const desc    = safeString(entry.summary || entry.content || '')
        const dateStr = safeString(entry.published || entry.updated || '')
        if (!title || !link) continue

        items.push({
          title,
          url:       link,
          author:    feed.name,
          date:      dateStr ? new Date(dateStr) : new Date(0),
          excerpt:   truncate(stripHtml(desc), 400),
          feedColor: feed.color,
          feedName:  feed.name,
          imageUrl:  extractImage(entry),
        })
      }
    }

    return items
  } catch {
    clearTimeout(timer)
    return []
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

let _cache: { posts: PostItem[]; failedCount: number; fetchedAt: Date } | null = null
let _cacheExpiry = 0

export async function fetchAllFeeds(): Promise<{
  posts: PostItem[]
  failedCount: number
  fetchedAt: Date
}> {
  const now = Date.now()
  if (_cache && now < _cacheExpiry) return _cache

  const results = await Promise.allSettled(FEEDS.map(fetchFeed))

  let failedCount = 0
  const allPosts: PostItem[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPosts.push(...result.value)
    } else {
      failedCount++
    }
  }

  // Round-robin by source so every feed gets fair representation.
  // Within each "round" the slots are filled newest-first per source,
  // then the full result is re-sorted by date so the reader still sees
  // recent content first but no single prolific source monopolises the list.
  const valid = allPosts.filter(p => p.date.getTime() > 0 && p.title && p.url)

  // Group and sort each source's posts newest-first
  const bySource = new Map<string, PostItem[]>()
  for (const p of valid) {
    const bucket = bySource.get(p.feedName) ?? []
    bucket.push(p)
    bySource.set(p.feedName, bucket)
  }
  for (const bucket of bySource.values()) {
    bucket.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Round-robin: one post per source per round, cap at 500
  const buckets = [...bySource.values()]
  const balanced: PostItem[] = []
  let round = 0
  while (balanced.length < 500) {
    let added = 0
    for (const bucket of buckets) {
      if (bucket[round]) { balanced.push(bucket[round]); added++ }
    }
    if (added === 0) break // all sources exhausted
    round++
  }

  // Final chronological sort so the timeline is still meaningful
  const posts = balanced.sort((a, b) => b.date.getTime() - a.date.getTime())

  _cache = { posts, failedCount, fetchedAt: new Date() }
  _cacheExpiry = now + CACHE_TTL_MS
  return _cache
}
