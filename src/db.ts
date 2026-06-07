import Dexie, { type Table } from 'dexie'

export interface Ingredient {
  name: string
  amount: number
  unit: string
}

export interface Recipe {
  id?: number
  title: string
  description: string
  imageUrl: string
  servings: number
  cookTimeMinutes: number
  ingredients: Ingredient[]
  steps: string[]
  sourceUrl?: string
  createdAt: Date
}

export interface ShoppingItem {
  id?: number
  name: string
  amount: number
  unit: string
  checked: boolean
  recipeId?: number
  recipeTitle?: string
}

class RecipeDatabase extends Dexie {
  recipes!: Table<Recipe>
  shoppingItems!: Table<ShoppingItem>

  constructor() {
    super('RecipeDB')
    this.version(1).stores({
      recipes: '++id, title, createdAt',
      shoppingItems: '++id, checked',
    })
  }
}

export const db = new RecipeDatabase()
