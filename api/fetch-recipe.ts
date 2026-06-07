import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url parameter required' })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const allowedHosts = ['cookpad.com', 'recipe.rakuten.co.jp', 'delishkitchen.tv', 'kurashiru.com', 'macaroni.id']
  const isAllowed = allowedHosts.some(h => targetUrl.hostname === h || targetUrl.hostname.endsWith('.' + h))
  if (!isAllowed) {
    return res.status(403).json({ error: 'Domain not allowed' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeApp/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await response.text()

    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    let recipe = null

    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim()
        try {
          const data = JSON.parse(content)
          const flat = Array.isArray(data) ? data : [data]
          // @graph 形式にも対応
          const items = flat.flatMap((d: unknown) =>
            (d as Record<string, unknown>)?.['@graph']
              ? (d as Record<string, unknown[]>)['@graph']
              : [d]
          )
          for (const item of items) {
            const t = (item as Record<string, unknown>)['@type']
            if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) { recipe = item; break }
          }
        } catch { /* skip */ }
        if (recipe) break
      }
    }

    if (!recipe) {
      return res.status(422).json({ error: 'Recipe structured data not found on this page' })
    }

    const parseFrac = (s: string) => {
      if (s.includes('/')) {
        const [a, b] = s.split('/')
        return (parseFloat(a) / parseFloat(b)) || 1
      }
      return parseFloat(s) || 1
    }
    const parseMeasure = (s: string): { amount: number; unit: string } => {
      const m1 = s.match(/^([^\d./]+)([\d./]+)$/)
      if (m1) return { unit: m1[1].trim(), amount: parseFrac(m1[2]) }
      const m2 = s.match(/^([\d./]+)(.*)$/)
      if (m2) return { amount: parseFrac(m2[1]), unit: m2[2].trim() }
      return { amount: 1, unit: s.trim() }
    }
    const parseIngredients = (raw: unknown[]) =>
      raw.map((i: unknown) => {
        const text = (typeof i === 'string' ? i : (i as { name?: string })?.name ?? '').trim()
        if (!text) return { name: '', amount: 1, unit: '' }
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

    const steps = (recipe.recipeInstructions ?? []).map((s: unknown) =>
      typeof s === 'string' ? s : (s as { text?: string })?.text ?? ''
    ).filter(Boolean)

    const images = recipe.image
    const imageUrl = Array.isArray(images)
      ? (typeof images[0] === 'string' ? images[0] : images[0]?.url ?? '')
      : (typeof images === 'string' ? images : images?.url ?? '')

    res.json({
      title: recipe.name ?? '',
      description: recipe.description ?? '',
      imageUrl,
      servings: parseInt(recipe.recipeYield ?? '2') || 2,
      cookTimeMinutes: parseTime(recipe.totalTime ?? recipe.cookTime ?? ''),
      ingredients: parseIngredients(recipe.recipeIngredient ?? []),
      steps,
      sourceUrl: url,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipe', detail: String(err) })
  }
}
