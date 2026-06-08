import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type Ingredient } from '../db'
import { ArrowLeft, Download, Plus, Trash2, Loader2, ImagePlus } from 'lucide-react'
import { fileToDataUrl } from '../utils/image'

interface FormIngredient extends Ingredient {
  key: number
}

const initialIngredient = (key: number): FormIngredient => ({ key, name: '', amount: 1, unit: '' })

const inputCls = 'w-full bg-orange-50 rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-gray-300 text-gray-700'
const smallInputCls = 'bg-orange-50 rounded-2xl px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700'

export function AddRecipe() {
  const navigate = useNavigate()
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [servings, setServings] = useState(2)
  const [cookTime, setCookTime] = useState(30)
  const [ingredients, setIngredients] = useState<FormIngredient[]>([initialIngredient(0)])
  const [steps, setSteps] = useState([''])
  const [sourceUrl, setSourceUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImageUrl(await fileToDataUrl(file))
    } catch {
      alert('画像の読み込みに失敗しました')
    } finally {
      e.target.value = ''
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    setImportError('')
    try {
      const res = await fetch(`/api/fetch-recipe?url=${encodeURIComponent(importUrl)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'インポートに失敗しました')
      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      setImageUrl(data.imageUrl ?? '')
      setServings(data.servings ?? 2)
      setCookTime(data.cookTimeMinutes ?? 30)
      setIngredients((data.ingredients ?? []).map((i: Ingredient, idx: number) => ({ ...i, key: idx })))
      setSteps(data.steps?.length ? data.steps : [''])
      setSourceUrl(importUrl)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setImporting(false)
    }
  }

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
      await db.recipes.add({
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
        createdAt: new Date(),
      })
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-10">
      <div className="bg-white rounded-b-[32px] shadow-sm px-5 pt-14 pb-5 flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="text-xs font-medium text-orange-400">New Recipe</p>
          <h1 className="text-xl font-bold text-gray-800">レシピを追加</h1>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* URLインポート */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">URLからインポート</p>
          <p className="text-xs text-gray-400 mb-3">クックパッド・楽天レシピ・デリッシュキッチン・クラシルなど</p>
          <div className="flex gap-2">
            <input
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder="https://cookpad.com/..."
              className={`flex-1 ${smallInputCls}`}
            />
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="w-11 h-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 shadow-sm shadow-orange-200"
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>
          {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
        </div>

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
            <label className="block text-xs text-gray-500 mb-1.5">完成画像</label>
            <div className="flex gap-2">
              <input value={imageUrl.startsWith('data:') ? '' : imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className={`flex-1 ${smallInputCls}`} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0 active:bg-orange-100"
              >
                <ImagePlus size={18} className="text-orange-400" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
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
