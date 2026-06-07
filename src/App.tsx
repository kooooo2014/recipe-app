import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { RecipeList } from './pages/RecipeList'
import { RecipeDetail } from './pages/RecipeDetail'
import { AddRecipe } from './pages/AddRecipe'
import { EditRecipe } from './pages/EditRecipe'
import { ShoppingList } from './pages/ShoppingList'

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-orange-50">
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipe/:id/edit" element={<EditRecipe />} />
          <Route path="/add" element={<AddRecipe />} />
          <Route path="/shopping" element={<ShoppingList />} />
        </Routes>
        <Routes>
          <Route path="/" element={<BottomNav />} />
          <Route path="/shopping" element={<BottomNav />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
