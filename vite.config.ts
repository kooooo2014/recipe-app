import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { IncomingMessage, ServerResponse } from 'node:http'

function recipeApiDevPlugin(): Plugin {
  return {
    name: 'recipe-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/fetch-recipe', async (req: IncomingMessage, res: ServerResponse) => {
        const urlParam = new URL(req.url!, `http://localhost`).searchParams.get('url')

        const json = (status: number, body: unknown) => {
          res.writeHead(status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(body))
        }

        if (!urlParam) return json(400, { error: 'url parameter required' })

        let targetUrl: URL
        try { targetUrl = new URL(urlParam) }
        catch { return json(400, { error: 'Invalid URL' }) }

        const allowedHosts = ['cookpad.com', 'recipe.rakuten.co.jp', 'delishkitchen.tv', 'kurashiru.com', 'macaroni.id']
        if (!allowedHosts.some(h => targetUrl.hostname === h || targetUrl.hostname.endsWith('.' + h)))
          return json(403, { error: 'Domain not allowed' })

        try {
          const response = await fetch(urlParam, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeApp/1.0)' },
            signal: AbortSignal.timeout(10000),
          })
          const html = await response.text()

          const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
          let recipe: Record<string, unknown> | null = null

          if (jsonLdMatch) {
            for (const block of jsonLdMatch) {
              const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim()
              try {
                const data = JSON.parse(content)
                const flat: unknown[] = Array.isArray(data) ? data : [data]
                // @graph 形式にも対応
                const items: unknown[] = flat.flatMap((d: unknown) =>
                  (d as Record<string, unknown>)?.['@graph']
                    ? (d as Record<string, unknown[]>)['@graph']
                    : [d]
                )
                for (const item of items) {
                  const t = (item as Record<string, unknown>)['@type']
                  if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) {
                    recipe = item as Record<string, unknown>; break
                  }
                }
              } catch { /* skip */ }
              if (recipe) break
            }
          }

          if (!recipe) return json(422, { error: 'Recipe structured data not found on this page' })

          const parseFrac = (s: string) => {
            if (s.includes('/')) {
              const [a, b] = s.split('/')
              return (parseFloat(a) / parseFloat(b)) || 1
            }
            return parseFloat(s) || 1
          }
          const parseMeasure = (s: string): { amount: number; unit: string } => {
            // 大さじ1 / 小さじ1/2 など：単位が前、数字が後
            const m1 = s.match(/^([^\d./]+)([\d./]+)$/)
            if (m1) return { unit: m1[1].trim(), amount: parseFrac(m1[2]) }
            // 200ml / 1/2丁 など：数字が前、単位が後
            const m2 = s.match(/^([\d./]+)(.*)$/)
            if (m2) return { amount: parseFrac(m2[1]), unit: m2[2].trim() }
            // 少々・適量など数字なし
            return { amount: 1, unit: s.trim() }
          }
          const parseIngredients = (raw: unknown[]) =>
            raw.map((i: unknown) => {
              const text = (typeof i === 'string' ? i : (i as { name?: string })?.name ?? '').trim()
              if (!text) return { name: '', amount: 1, unit: '' }
              // 最後の半角・全角スペースで名前と量を分割
              const idx = Math.max(text.lastIndexOf(' '), text.lastIndexOf('　'))
              if (idx > 0) {
                const { amount, unit } = parseMeasure(text.slice(idx + 1).trim())
                return { name: text.slice(0, idx).trim(), amount, unit }
              }
              return { name: text, amount: 1, unit: '' }
            })

          const parseTime = (iso: string) => {
            if (!iso) return 0
            const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
            return m ? (parseInt(m[1] ?? '0') * 60 + parseInt(m[2] ?? '0')) : 0
          }

          const steps = ((recipe.recipeInstructions as unknown[] ?? [])).map((s: unknown) =>
            typeof s === 'string' ? s : (s as { text?: string })?.text ?? ''
          ).filter(Boolean)

          const images = recipe.image
          const imageUrl = Array.isArray(images)
            ? (typeof images[0] === 'string' ? images[0] : (images[0] as { url?: string })?.url ?? '')
            : (typeof images === 'string' ? images : (images as { url?: string })?.url ?? '')

          json(200, {
            title: recipe.name ?? '',
            description: recipe.description ?? '',
            imageUrl,
            servings: parseInt(String(recipe.recipeYield ?? '2')) || 2,
            cookTimeMinutes: parseTime(String(recipe.totalTime ?? recipe.cookTime ?? '')),
            ingredients: parseIngredients(recipe.recipeIngredient as unknown[] ?? []),
            steps,
            sourceUrl: urlParam,
          })
        } catch (err) {
          json(500, { error: 'Failed to fetch recipe', detail: String(err) })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    recipeApiDevPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'レシピ帳',
        short_name: 'レシピ帳',
        description: 'レシピ保存と買い物リストアプリ',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ja',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
