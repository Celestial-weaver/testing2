import { auth } from "./firebase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAuthToken()

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.message || "API request failed")
    }

    return response.json()
  }

  // Auth endpoints
  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async linkAccount(data: { email: string; firebaseUid: string; userType?: string }) {
    return this.request("/auth/link-account", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request("/auth/me")
  }

  // Partners endpoints
  async getPartners(params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/partners${queryString}`)
  }

  async searchPartners(params: Record<string, any>) {
    const queryString = "?" + new URLSearchParams(params).toString()
    return this.request(`/partners/search${queryString}`)
  }

  async getPartner(id: string) {
    return this.request(`/partners/${id}`)
  }

  async getPartnerAvailability(id: string, params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/partners/${id}/availability${queryString}`)
  }

  // Orders endpoints
  async getOrders(params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/orders${queryString}`)
  }

  async createOrder(orderData: any) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`)
  }

  async updateOrder(id: string, orderData: any) {
    return this.request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(orderData),
    })
  }

  // Clients endpoints
  async getClients(params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/clients${queryString}`)
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}`)
  }

  async getClientOrders(id: string, params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/clients/${id}/orders${queryString}`)
  }

  // Admin endpoints
  async getDashboard(params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/admins/dashboard${queryString}`)
  }

  async getSystemHealth() {
    return this.request("/admins/system-health")
  }

  async getAnalytics(params?: Record<string, any>) {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return this.request(`/admins/analytics${queryString}`)
  }
}

export const apiClient = new ApiClient()
