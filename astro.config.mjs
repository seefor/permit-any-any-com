import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import cloudflare from '@astrojs/cloudflare'

// Note: @astrojs/sitemap is installed but not activated here because the site
// uses output: 'server' (SSR) with no prerendered pages. The sitemap integration
// crashes with SSR-only builds (astro:build:done receives undefined pages).
// The hand-crafted /sitemap.xml route (src/pages/sitemap.xml.ts) handles this
// correctly and already covers all public URLs including /trending.

export default defineConfig({
  site: 'https://permit-any-any.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [tailwind()],
})
