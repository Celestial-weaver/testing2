"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { apiClient } from "@/lib/api"

interface AuthContextType {
  user: User | null
  userData: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  linkExistingAccount: (email: string, userType?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const response = await apiClient.getCurrentUser()
          setUserData(response.data)
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserData(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Register user in our database
      await apiClient.register({
        ...userData,
        email,
        firebaseUid: firebaseUser.uid,
      })
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Google sign in error:", error)
      throw error
    }
  }

  const linkExistingAccount = async (email: string, userType?: string) => {
    try {
      if (!user) throw new Error("No authenticated user")

      await apiClient.linkAccount({
        email,
        firebaseUid: user.uid,
        userType,
      })

      // Refresh user data
      const response = await apiClient.getCurrentUser()
      setUserData(response.data)
    } catch (error) {
      console.error("Link account error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserData(null)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    linkExistingAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
