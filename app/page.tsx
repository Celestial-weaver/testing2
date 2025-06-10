"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Camera, Award } from "lucide-react"
import { apiClient } from "@/lib/api"
import Link from "next/link"

interface Partner {
  _id: string
  username: string
  companyName: string
  profilePic?: { url: string }
  shootType: string[]
  locations: Array<{ city: string; state: string }>
  pricePerDay: number
  ratings: { average: number; totalReviews: number }
  yearsOfExperience: number
  verified: boolean
}

const shootTypes = [
  "All",
  "Wedding",
  "Portrait",
  "Maternity",
  "Fashion",
  "Events",
  "Corporate",
  "Newborn",
  "Family",
  "Product",
  "Architecture",
]

export default function HomePage() {
  const [location, setLocation] = useState("")
  const [shootType, setShootType] = useState("All")
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalPartners: 1200,
    happyClients: 50000,
    citiesCovered: 120,
    satisfactionRate: 98,
  })

  useEffect(() => {
    fetchPopularPartners()
  }, [])

  const fetchPopularPartners = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPartners({
        verified: "true",
        limit: 8,
        sortBy: "ratings.average",
        sortOrder: "desc",
      })
      setPartners(response.data || [])
    } catch (error) {
      console.error("Error fetching partners:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const searchParams: any = { limit: 20 }

      if (location) searchParams.city = location
      if (shootType !== "All") searchParams.shootType = shootType.toLowerCase()

      const response = await apiClient.searchPartners(searchParams)
      setPartners(response.data || [])
    } catch (error) {
      console.error("Error searching partners:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Pixisphere</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/photographers" className="text-gray-600 hover:text-gray-900">
                Photographers
              </Link>
              <Link href="/studios" className="text-gray-600 hover:text-gray-900">
                Studios
              </Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">
                How it works
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/blog" className="text-gray-600 hover:text-gray-900">
                Blog
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Join now</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find the perfect
            <br />
            <span className="text-blue-600">photographer for you</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Connect with verified professionals and studios for your special moments
          </p>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-16">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Where do you need a photographer?
                </label>
                <Input
                  placeholder="Enter city or location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of photography do you need?
                </label>
                <Select value={shootType} onValueChange={setShootType}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shootTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Describe your perfect photoshoot with AI</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalPartners.toLocaleString()}+</div>
              <div className="text-gray-600">Verified Photographers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.happyClients.toLocaleString()}+</div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.citiesCovered}+</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.satisfactionRate}%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Photography Types */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Photography Types</h2>
            <Button variant="outline">Show all</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            {shootTypes.slice(1).map((type) => (
              <Button
                key={type}
                variant={shootType === type ? "default" : "outline"}
                onClick={() => setShootType(type)}
                className="rounded-full"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Photographers */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Popular photographers in Mumbai</h2>
            <Button variant="outline">Show all</Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partners.map((partner) => (
                <Card key={partner._id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={partner.profilePic?.url || "/placeholder.svg?height=200&width=300"}
                        alt={partner.companyName}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {partner.verified && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge className="absolute top-2 right-2 bg-blue-500">Client favorite</Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-500">
                          {partner.shootType[0]} in {partner.locations[0]?.city}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{partner.companyName}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium ml-1">{partner.ratings.average.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-gray-500">{partner.yearsOfExperience}+ years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          ₹{partner.pricePerDay.toLocaleString()} per session
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{partner.locations[0]?.city}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How we work</h2>
          <p className="text-gray-600 mb-12">Simple steps to find and book your perfect photographer</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Search</h3>
              <p className="text-gray-600">Explore our curated list of verified photographers and studios</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Discuss</h3>
              <p className="text-gray-600">Chat directly with photographers to discuss your requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book & Enjoy</h3>
              <p className="text-gray-600">Secure your booking and enjoy your professional photoshoot</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Camera className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">Pixisphere</span>
              </div>
              <p className="text-gray-400 mb-4">Find verified photographers and studios for your special moments.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/photographers">Find photographers</Link>
                </li>
                <li>
                  <Link href="/studios">Browse studios</Link>
                </li>
                <li>
                  <Link href="/how-it-works">How it works</Link>
                </li>
                <li>
                  <Link href="/pricing">Pricing</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Photographers</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/join">Join as photographer</Link>
                </li>
                <li>
                  <Link href="/studio-partnerships">Studio partnerships</Link>
                </li>
                <li>
                  <Link href="/resources">Resources</Link>
                </li>
                <li>
                  <Link href="/success-stories">Success stories</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help">Help center</Link>
                </li>
                <li>
                  <Link href="/contact">Contact us</Link>
                </li>
                <li>
                  <Link href="/privacy">Privacy policy</Link>
                </li>
                <li>
                  <Link href="/terms">Terms of service</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Pixisphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
