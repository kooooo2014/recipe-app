import { NavLink } from 'react-router-dom'
import { BookOpen, ShoppingCart, Plus } from 'lucide-react'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white border-t border-orange-100 flex items-center justify-around pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-10 text-xs gap-1 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-300'}`
          }
        >
          <BookOpen size={22} />
          <span className="font-medium">レシピ</span>
        </NavLink>
        <NavLink to="/add" className="flex flex-col items-center -mt-5">
          <div className="bg-orange-500 rounded-full p-4 shadow-lg shadow-orange-200">
            <Plus size={24} className="text-white" />
          </div>
        </NavLink>
        <NavLink
          to="/shopping"
          className={({ isActive }) =>
            `flex flex-col items-center py-3 px-10 text-xs gap-1 transition-colors ${isActive ? 'text-orange-500' : 'text-gray-300'}`
          }
        >
          <ShoppingCart size={22} />
          <span className="font-medium">買い物</span>
        </NavLink>
      </div>
    </nav>
  )
}
