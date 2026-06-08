import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Link } from 'react-router-dom'
import { Clock, Search, Download, Upload } from 'lucide-react'
import { useState, useRef } from 'react'
import type { Recipe } from '../db'

export function RecipeList() {
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recipes = useLiveQuery(() =>
    query
      ? db.recipes.filter(r => r.title.includes(query)).toArray()
      : db.recipes.orderBy('createdAt').reverse().toArray()
  , [query])

  const handleExport = async () => {
    const all = await db.recipes.toArray()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = all.map(({ id: _id, ...r }) => r)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recipes_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data)) throw new Error()
      const toAdd: Omit<Recipe, 'id'>[] = data.map((r: Recipe) => ({
        title: String(r.title ?? ''),
        description: String(r.description ?? ''),
        imageUrl: String(r.imageUrl ?? ''),
        servings: Number(r.servings) || 2,
        cookTimeMinutes: Number(r.cookTimeMinutes) || 0,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: Array.isArray(r.steps) ? r.steps : [],
        sourceUrl: r.sourceUrl,
        createdAt: new Date(r.createdAt ?? Date.now()),
      }))
      await db.recipes.bulkAdd(toAdd)
      alert(`${toAdd.length}件のレシピをインポートしました`)
    } catch {
      alert('インポートに失敗しました。ファイル形式を確認してください')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-28">
      <div className="bg-white rounded-b-[32px] shadow-sm px-5 pt-14 pb-5">
        <p className="text-xs font-medium text-orange-400 mb-0.5">My Recipe</p>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">レシピ帳</h1>
          <div className="flex gap-1">
            <button
              onClick={handleExport}
              className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center active:bg-orange-100"
              title="エクスポート"
            >
              <Download size={16} className="text-orange-400" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center active:bg-orange-100"
              title="インポート"
            >
              <Upload size={16} className="text-orange-400" />
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-300" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="レシピを検索..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-orange-50 outline-none placeholder:text-gray-300 text-gray-700"
          />
        </div>
      </div>

      <div className="px-4 mt-4">
        {!recipes || recipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-3">🍳</div>
            <p className="font-semibold text-gray-600">レシピがまだありません</p>
            <p className="text-sm text-gray-400 mt-1">下の ＋ からレシピを追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map(recipe => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="flex items-center bg-white rounded-3xl shadow-sm p-3 gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-orange-100">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍳</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h2 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{recipe.title}</h2>
                  {recipe.cookTimeMinutes > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-400 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                        <Clock size={10} />
                        {recipe.cookTimeMinutes}分
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
