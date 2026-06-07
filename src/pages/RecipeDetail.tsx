import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useState } from 'react'
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus, Clock, Pencil } from 'lucide-react'
import { Timer } from '../components/Timer'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = useLiveQuery(() => db.recipes.get(Number(id)), [id])
  const [servings, setServings] = useState<number | null>(null)

  if (!recipe) return <div className="p-4 text-center text-gray-400 pt-20">読み込み中...</div>

  const currentServings = servings ?? recipe.servings
  const ratio = currentServings / recipe.servings

  const addToShopping = async () => {
    for (const ing of recipe.ingredients) {
      await db.shoppingItems.add({
        name: ing.name,
        amount: Math.round(ing.amount * ratio * 10) / 10,
        unit: ing.unit,
        checked: false,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
      })
    }
    navigate('/shopping')
  }

  const deleteRecipe = async () => {
    if (confirm(`「${recipe.title}」を削除しますか？`)) {
      await db.recipes.delete(recipe.id!)
      navigate('/')
    }
  }

  const NON_SCALE_UNITS = ['少々', '適量', '適宜', 'お好みで', 'ひとつまみ', '少量']

  const formatIngAmt = (amount: number, unit: string, ratio: number) => {
    if (NON_SCALE_UNITS.some(u => unit.includes(u))) return unit
    const v = Math.round(amount * ratio * 10) / 10
    const numStr = v % 1 === 0 ? String(Math.round(v)) : String(v)
    return numStr + unit
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-32">
      {/* Hero */}
      <div className="relative">
        <div className="w-full h-60 bg-orange-100">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🍳</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="absolute top-0 left-0 right-0 flex justify-between p-4 pt-12">
          <button onClick={() => navigate(-1)} className="bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/recipe/${id}/edit`, { replace: true })}
              className="bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md"
            >
              <Pencil size={18} className="text-orange-500" />
            </button>
            <button onClick={deleteRecipe} className="bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md">
              <Trash2 size={18} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-3">
        {/* タイトルカード */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-800">{recipe.title}</h1>
          {recipe.description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{recipe.description}</p>}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {recipe.cookTimeMinutes > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-400 text-xs font-medium px-3 py-1 rounded-full">
                <Clock size={11} />
                {recipe.cookTimeMinutes}分
              </span>
            )}
            <span className="inline-flex items-center bg-orange-50 text-orange-400 text-xs font-medium px-3 py-1 rounded-full">
              基本 {recipe.servings}人分
            </span>
            {recipe.sourceUrl && (
              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-orange-400 text-xs underline truncate max-w-40">
                元レシピを見る
              </a>
            )}
          </div>
        </div>

        {/* 人数調整 */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">人数を調整</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setServings(s => Math.max(1, (s ?? recipe.servings) - 1))}
              className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center active:bg-orange-100 transition-colors"
            >
              <Minus size={16} className="text-orange-500" />
            </button>
            <div className="text-center w-20">
              <span className="text-4xl font-bold text-orange-500">{currentServings}</span>
              <span className="text-sm text-gray-400 ml-1.5">人分</span>
            </div>
            <button
              onClick={() => setServings(s => (s ?? recipe.servings) + 1)}
              className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center active:bg-orange-100 transition-colors"
            >
              <Plus size={16} className="text-orange-500" />
            </button>
          </div>
        </div>

        {/* 材料 */}
        {recipe.ingredients.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">材料</p>
            <div className="divide-y divide-orange-50">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-700">{ing.name}</span>
                  <span className="text-sm font-semibold text-orange-500">
                    {formatIngAmt(ing.amount, ing.unit, ratio)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* タイマー */}
        {recipe.cookTimeMinutes > 0 && (
          <Timer initialMinutes={recipe.cookTimeMinutes} />
        )}

        {/* 作り方 */}
        {recipe.steps.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">作り方</p>
            <div className="space-y-4">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 買い物リストボタン */}
        <button
          onClick={addToShopping}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:bg-orange-600 shadow-md shadow-orange-200"
        >
          <ShoppingCart size={20} />
          買い物リストに追加（{currentServings}人分）
        </button>
      </div>
    </div>
  )
}
