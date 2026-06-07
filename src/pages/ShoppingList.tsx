import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ShoppingItem } from '../db'
import { Trash2, CheckCircle2, Circle, Plus } from 'lucide-react'
import { useState } from 'react'

export function ShoppingList() {
  const items = useLiveQuery(() => db.shoppingItems.toArray())
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')

  const toggle = (id: number, checked: boolean) => db.shoppingItems.update(id, { checked: !checked })
  const remove = (id: number) => db.shoppingItems.delete(id)
  const clearChecked = () => db.shoppingItems.where('checked').equals(1).delete()

  const addManual = async () => {
    const name = newName.trim()
    if (!name) return
    await db.shoppingItems.add({
      name,
      amount: parseFloat(newAmount) || 1,
      unit: newUnit.trim(),
      checked: false,
    })
    setNewName('')
    setNewAmount('')
    setNewUnit('')
  }

  const grouped = items?.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.recipeTitle ?? '手動追加'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {}) ?? {}

  const uncheckedCount = items?.filter(i => !i.checked).length ?? 0

  return (
    <div className="min-h-screen bg-orange-50 pb-28">
      <div className="bg-white rounded-b-[32px] shadow-sm px-5 pt-14 pb-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-orange-400 mb-0.5">Shopping</p>
            <h1 className="text-2xl font-bold text-gray-800">買い物リスト</h1>
          </div>
          {items && items.some(i => i.checked) && (
            <button
              onClick={clearChecked}
              className="mt-2 text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1.5"
            >
              チェック済みを削除
            </button>
          )}
        </div>
        {uncheckedCount > 0 && (
          <p className="text-sm text-gray-400 mt-1.5">
            残り <span className="text-orange-500 font-semibold">{uncheckedCount}</span> 品
          </p>
        )}
      </div>

      <div className="px-4 mt-4">
        {/* 手動追加 */}
        <div className="bg-white rounded-3xl shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">アイテムを追加</p>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="アイテム名"
            className="w-full bg-orange-50 rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700 mb-2"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="量"
              min={0}
              className="w-20 bg-orange-50 rounded-2xl px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700 text-center"
            />
            <input
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="単位（g・個など）"
              className="flex-1 bg-orange-50 rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-gray-300 text-gray-700"
            />
            <button
              onClick={addManual}
              disabled={!newName.trim()}
              className="w-11 h-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 shadow-sm shadow-orange-200"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {!items || items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🛒</div>
            <p className="font-semibold text-gray-500">リストは空です</p>
            <p className="text-sm text-gray-400 mt-1">レシピから材料を追加できます</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1">{group}</p>
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-orange-50">
                  {groupItems!.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <button onClick={() => toggle(item.id!, item.checked)} className="flex-shrink-0">
                        {item.checked
                          ? <CheckCircle2 size={22} className="text-orange-400" />
                          : <Circle size={22} className="text-gray-200" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${item.checked ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                      </div>
                      {(item.unit || item.amount !== 1) && (
                        <span className={`text-sm font-semibold flex-shrink-0 ${item.checked ? 'text-gray-300' : 'text-orange-500'}`}>
                          {item.amount}{item.unit}
                        </span>
                      )}
                      <button onClick={() => remove(item.id!)} className="text-gray-200 p-1 flex-shrink-0 active:text-gray-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
