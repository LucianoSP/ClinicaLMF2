import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const guideData = await request.json()

    // Se for uma única guia, converte para array
    const guides = Array.isArray(guideData) ? guideData : [guideData]

    // Salva cada guia no Supabase
    const results = await Promise.all(
      guides.map(async (guide) => {
        const { data, error } = await supabase
          .from('guias_unimed')
          .upsert({
            numero_guia: guide.numero_guia,
            carteira: guide.carteira,
            nome_paciente: guide.nome_paciente,
            data_execucao: guide.data_execucao,
            nome_profissional: guide.nome_profissional,
            status: guide.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'numero_guia'
          })
          .select()

        if (error) {
          console.error('Erro ao salvar guia:', error)
          throw error
        }

        return data?.[0]
      })
    )

    return NextResponse.json({
      message: 'Guias salvas com sucesso',
      guides: results
    })
  } catch (error) {
    console.error('Erro ao salvar guias:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar guias' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 100
    const offset = Number(searchParams.get('offset')) || 0
    const numero_guia = searchParams.get('numero_guia')
    const carteira = searchParams.get('carteira')
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    const status = searchParams.get('status')

    // Construir a query base
    let query = supabase
      .from('guias_unimed')
      .select('*')

    // Aplicar filtros
    if (numero_guia) {
      query = query.eq('numero_guia', numero_guia)
    }
    if (carteira) {
      query = query.eq('carteira', carteira)
    }
    if (data_inicio) {
      query = query.gte('data_execucao', data_inicio)
    }
    if (data_fim) {
      query = query.lte('data_execucao', data_fim)
    }
    if (status) {
      query = query.eq('status', status)
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
