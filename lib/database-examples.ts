// Example database connection patterns you can use

// 1. With Supabase
/*
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getBooksFromSupabase() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('title')
  
  if (error) throw error
  return data
}
*/

// 2. With Neon (PostgreSQL)
/*
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function getBooksFromNeon() {
  const books = await sql`
    SELECT * FROM books 
    ORDER BY title ASC
  `
  return books
}
*/

// 3. With Prisma
/*
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getBooksFromPrisma() {
  return await prisma.book.findMany({
    orderBy: { title: 'asc' }
  })
}
*/

// 4. With Drizzle ORM
/*
import { db } from '@/lib/db'
import { books } from '@/lib/schema'

export async function getBooksFromDrizzle() {
  return await db.select().from(books).orderBy(books.title)
}
*/

export {}
