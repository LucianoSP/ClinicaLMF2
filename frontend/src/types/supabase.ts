export type Usuario = {
  id: string
  email: string
  nome: string
  role: 'admin' | 'profissional' | 'secretaria'
  created_at: string
  updated_at: string
}
