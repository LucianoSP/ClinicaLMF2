import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Usuario } from '@/types/supabase'

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

  const getOrCreateUser = async (authUser: any) => {
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
          nome: authUser.email.split('@')[0], // Nome temporário baseado no email
          tipo_usuario: 'usuario', // Tipo padrão
          ativo: true,
          ultimo_acesso: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      return null
    }

    return newUser
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const userData = await getOrCreateUser(session.user)
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const userData = await getOrCreateUser(data.user)
        if (!userData) {
          throw new Error('Erro ao criar/buscar usuário')
        }
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
