import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { limit = 100, offset = 0, filters = {} } = await request.json()

    // Construir a query base
    let query = supabase
      .from('guias_unimed')
      .select('*')

    // Aplicar filtros
    if (filters.numero_guia) {
      query = query.eq('numero_guia', filters.numero_guia)
    }
    if (filters.carteira) {
      query = query.eq('carteira', filters.carteira)
    }
    if (filters.data_inicio) {
      query = query.gte('data_atendimento', filters.data_inicio)
    }
    if (filters.data_fim) {
      query = query.lte('data_atendimento', filters.data_fim)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('created_at', { ascending: false })

    // Aplicar paginação
    const { data: totalData } = await query
    const total = totalData?.length || 0

    query = query.range(offset, offset + limit - 1)

    const { data: guides, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      guides: guides || [],
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Erro ao buscar guias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar guias' },
      { status: 500 }
    )
  }
}
