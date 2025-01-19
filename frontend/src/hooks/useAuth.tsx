'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { user: authUser } = session
        const dbUser = await getOrCreateUser(authUser)
        setUser(dbUser)
      } else {
        setUser(null)
      }
      setLoading(false)
      router.refresh()
    })

    // Verificar sessão inicial
    checkUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const dbUser = await getOrCreateUser(authUser)
        setUser(dbUser)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOrCreateUser = async (authUser: any) => {
    try {
      // Primeiro, tenta buscar o usuário existente
      const { data: existingUser, error: fetchError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      if (existingUser) {
        // Se encontrou o usuário, atualiza o último acesso
        const { data: updatedUser, error: updateError } = await supabase
          .from('usuarios')
          .update({ ultimo_acesso: new Date().toISOString() })
          .eq('auth_user_id', authUser.id)
          .select()
          .single()

        if (updateError) {
          console.error('Erro ao atualizar último acesso:', updateError)
          return existingUser
        }
        return updatedUser
      }

      // Se não encontrou o usuário, cria um novo
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert([
          {
            auth_user_id: authUser.id,
            email: authUser.email,
            nome: authUser.email?.split('@')[0] || 'Usuário',
            ultimo_acesso: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return newUser
    } catch (error) {
      console.error('Erro ao buscar/criar usuário:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
