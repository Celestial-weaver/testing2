"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, RefreshCw } from "lucide-react"

interface Book {
  id: number
  title: string
  author: string
  isbn: string
  publishedYear: number
  genre: string
  availableCopies: number
  totalCopies: number
  description: string
}

interface ApiResponse {
  success: boolean
  data: Book[]
  total: number
  message: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState("")
  const [availableOnly, setAvailableOnly] = useState(false)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (genreFilter) params.append("genre", genreFilter)
      if (availableOnly) params.append("available", "true")

      const response = await fetch(`/api/books?${params.toString()}`)
      const result: ApiResponse = await response.json()

      if (result.success) {
        setBooks(result.data)
      } else {
        setError(result.message || "Failed to fetch books")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching books:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [genreFilter, availableOnly])

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const uniqueGenres = [...new Set(books.map((book) => book.genre))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading books...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={fetchBooks}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Library Books</h1>
        <Badge variant="secondary">{books.length} total</Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {uniqueGenres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={availableOnly ? "default" : "outline"}
          onClick={() => setAvailableOnly(!availableOnly)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Available Only
        </Button>

        <Button onClick={fetchBooks} variant="outline">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="h-full">
            <CardHeader>
              <CardTitle className="line-clamp-2">{book.title}</CardTitle>
              <CardDescription>by {book.author}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-3">{book.description}</p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{book.genre}</Badge>
                <Badge variant="outline">{book.publishedYear}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ISBN:</span>
                  <span className="font-mono">{book.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className={book.availableCopies > 0 ? "text-green-600" : "text-red-600"}>
                    {book.availableCopies} / {book.totalCopies}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={book.availableCopies === 0}
                variant={book.availableCopies > 0 ? "default" : "secondary"}
              >
                {book.availableCopies > 0 ? "Borrow Book" : "Not Available"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No books found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
