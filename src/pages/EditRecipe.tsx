import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, type Ingredient } from '../db'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'

interface FormIngredient extends Ingredient {
  key: number
}

const initialIngredient = (key: number): FormIngredient => ({ key, name: '', amount: 1, unit: '' })

const inputCls = 'w-full bg-orange-50 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-gray-300 text-gray-700'
const smallInputCls = 'bg-orange-50 rounded-2xl px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700'

export function EditRecipe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [servings, setServings] = useState(2)
  const [cookTime, setCookTime] = useState(30)
  const [ingredients, setIngredients] = useState<FormIngredient[]>([initialIngredient(0)])
  const [steps, setSteps] = useState([''])
  const [sourceUrl, setSourceUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    db.recipes.get(Number(id)).then(recipe => {
      if (!recipe) { navigate('/'); return }
      setTitle(recipe.title)
      setDescription(recipe.description)
      setImageUrl(recipe.imageUrl)
      setServings(recipe.servings)
      setCookTime(recipe.cookTimeMinutes)
      setIngredients(recipe.ingredients.map((i, idx) => ({ ...i, key: idx })))
      setSteps(recipe.steps.length ? recipe.steps : [''])
      setSourceUrl(recipe.sourceUrl ?? '')
      setLoading(false)
    })
  }, [id, navigate])

  const addIngredient = () => setIngredients(prev => [...prev, initialIngredient(Date.now())])
  const updateIngredient = (key: number, field: keyof Ingredient, value: string | number) =>
    setIngredients(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
  const removeIngredient = (key: number) => setIngredients(prev => prev.filter(i => i.key !== key))

  const addStep = () => setSteps(prev => [...prev, ''])
  const updateStep = (idx: number, val: string) => setSteps(prev => prev.map((s, i) => i === idx ? val : s))
  const removeStep = (idx: number) => setSteps(prev => prev.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!title.trim()) return alert('タイトルを入力してください')
    setSaving(true)
    try {
      await db.recipes.update(Number(id), {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        servings,
        cookTimeMinutes: cookTime,
        ingredients: ingredients
          .filter(i => i.name.trim())
          .map(({ name, amount, unit }) => ({ name: name.trim(), amount: Number(amount) || 1, unit: unit.trim() })),
        steps: steps.filter(s => s.trim()),
        sourceUrl: sourceUrl.trim() || undefined,
      })
      navigate(`/recipe/${id}`, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-center text-gray-400 pt-20">読み込み中...</div>

  return (
    <div className="min-h-screen bg-orange-50 pb-10">
      <div className="bg-white rounded-b-[32px] shadow-sm px-5 pt-14 pb-5 flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="text-xs font-medium text-orange-400">Edit Recipe</p>
          <h1 className="text-xl font-bold text-gray-800">レシピを編集</h1>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* 基本情報 */}
        <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">基本情報</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">タイトル <span className="text-orange-400">*</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="料理名" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">説明</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="料理の説明"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">完成画像URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className={inputCls} />
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 w-full h-32 object-cover rounded-2xl" />}
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">基本人数</label>
              <input
                type="number" min={1} value={servings}
                onChange={e => setServings(Number(e.target.value))}
                className={`${smallInputCls} w-full text-center`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">調理時間（分）</label>
              <input
                type="number" min={0} value={cookTime}
                onChange={e => setCookTime(Number(e.target.value))}
                className={`${smallInputCls} w-full text-center`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">元のレシピURL</label>
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." className={inputCls} />
          </div>
        </div>

        {/* 材料 */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">材料</p>
            <button onClick={addIngredient} className="text-orange-500 text-xs font-medium flex items-center gap-1">
              <Plus size={13} /> 追加
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map(ing => (
              <div key={ing.key} className="flex gap-2 items-center">
                <input
                  value={ing.name}
                  onChange={e => updateIngredient(ing.key, 'name', e.target.value)}
                  placeholder="材料名"
                  className={`flex-1 ${smallInputCls}`}
                />
                <input
                  type="number" value={ing.amount} min={0}
                  onChange={e => updateIngredient(ing.key, 'amount', e.target.value)}
                  className={`w-16 ${smallInputCls} text-center`}
                />
                <input
                  value={ing.unit}
                  onChange={e => updateIngredient(ing.key, 'unit', e.target.value)}
                  placeholder="単位"
                  className={`w-16 ${smallInputCls}`}
                />
                <button onClick={() => removeIngredient(ing.key)} className="text-gray-300 p-1 active:text-gray-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 作り方 */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">作り方</p>
            <button onClick={addStep} className="text-orange-500 text-xs font-medium flex items-center gap-1">
              <Plus size={13} /> 追加
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center mt-1.5">
                  {i + 1}
                </div>
                <textarea
                  value={step}
                  onChange={e => updateStep(i, e.target.value)}
                  rows={2}
                  placeholder={`手順 ${i + 1}`}
                  className={`flex-1 ${smallInputCls} resize-none`}
                />
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} className="text-gray-300 p-1 mt-1.5 active:text-gray-500">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 active:bg-orange-600 shadow-md shadow-orange-200 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> 保存中...</> : '保存する'}
        </button>
      </div>
    </div>
  )
}
