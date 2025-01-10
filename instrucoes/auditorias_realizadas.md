# Resumo das Divergências no Código

## Tipos de Divergências (tipo_divergencia)

1. `data_divergente`: Quando a data_execucao é diferente da data_atendimento
2. `ficha_sem_assinatura`: Quando falta assinatura na ficha
3. `execucao_sem_ficha`: Quando há execução sem ficha correspondente
4. `ficha_sem_execucao`: Quando há ficha sem execução correspondente
5. `quantidade_excedida`: Quando excede quantidade autorizada na guia
6. `guia_vencida`: Quando a guia está fora da validade

## Status das Divergências (status_divergencia)

* `pendente`: Divergência identificada
* `em_analise`: Em processo de verificação
* `resolvida`: Divergência corrigida
* `cancelada`: Divergência desconsiderada

## Status das Guias (status_guia)

* `pendente`: Aguardando início
* `em_andamento`: Execuções em andamento
* `concluida`: Todas execuções realizadas
* `cancelada`: Guia cancelada

## 1. Data Divergente (data_divergente)

* Descrição: Quando a data_execucao é diferente da data_atendimento para mesma sessão
* Campo chave: codigo_ficha
* Campos verificados:
  * execucoes.data_execucao (obrigatório)
  * fichas_presenca.data_atendimento (opcional)

## 2. Ficha sem Assinatura (ficha_sem_assinatura)

* Descrição: Quando uma ficha de presença não possui assinatura ou arquivo digitalizado
* Campo chave: codigo_ficha
* Campos verificados:
  * fichas_presenca.possui_assinatura
  * fichas_presenca.arquivo_digitalizado

## 3. Execução sem Ficha (execucao_sem_ficha)

* Descrição: Quando existe uma execução mas não há ficha correspondente
* Campo chave: codigo_ficha
* Campos verificados:
  * execucoes.codigo_ficha

## 4. Ficha sem Execução (ficha_sem_execucao)

* Descrição: Quando existe uma ficha mas não há execução correspondente
* Campo chave: codigo_ficha
* Campos verificados:
  * fichas_presenca.codigo_ficha

## 5. Quantidade Excedida por Guia (quantidade_excedida_guia)

* Descrição: Quando o número de execuções excede o autorizado na guia
* Campo chave: numero_guia
* Campos verificados:
  * guias.quantidade_autorizada
  * Contagem de execucoes.numero_guia

## Observações Importantes

* O código_ficha é o identificador principal para relacionar fichas e execuções
* data_atendimento é opcional na tabela fichas_presenca
* Todas as divergências devem incluir:
  * numero_guia
  * tipo_divergencia
  * descricao
  * paciente_nome
  * codigo_ficha (quando aplicável)

## Estrutura de Tabelas

{
 "divergencias": {
   "columns": [
     {
       "name": "id",
       "type": "uuid"
     },
     {
       "name": "numero_guia",
       "type": "text"
     },
     {
       "name": "data_execucao", 
       "type": "date"
     },
     {
       "name": "codigo_ficha",
       "type": "text"
     },
     {
       "name": "tipo_divergencia",
       "type": "tipo_divergencia"
     },
     {
       "name": "descricao",
       "type": "text"
     },
     {
       "name": "status",
       "type": "status_divergencia"
     },
     {
       "name": "data_identificacao",
       "type": "timestamptz"
     },
     {
       "name": "data_resolucao",
       "type": "timestamptz" 
     },
     {
       "name": "resolvido_por",
       "type": "uuid"
     },
     {
       "name": "observacoes",
       "type": "text"
     },
     {
       "name": "created_at",
       "type": "timestamptz"
     },
     {
       "name": "updated_at",
       "type": "timestamptz"
     },
     {
       "name": "paciente_nome",
       "type": "text"
     },
     {
       "name": "ficha_id",
       "type": "uuid"
     },
     {
       "name": "execucao_id",
       "type": "uuid"
     },
     {
       "name": "prioridade",
       "type": "text"
     },
     {
       "name": "detalhes",
       "type": "jsonb"
     },
     {
       "name": "data_atendimento",
       "type": "date"
     },
     {
       "name": "carteirinha",
       "type": "varchar"
     }
   ]
 }
}

{
 "execucoes": {
   "columns": [
     {
       "name": "id",
       "type": "uuid"
     },
     {
       "name": "numero_guia",
       "type": "text"
     },
     {
       "name": "paciente_nome",
       "type": "text"
     },
     {
       "name": "data_execucao",
       "type": "date"
     },
     {
       "name": "paciente_carteirinha",
       "type": "text"
     },
     {
       "name": "paciente_id",
       "type": "text"
     },
     {
       "name": "usuario_executante",
       "type": "uuid"
     },
     {
       "name": "created_at",
       "type": "timestamptz"
     },
     {
       "name": "updated_at",
       "type": "timestamptz"
     },
     {
       "name": "codigo_ficha",
       "type": "text"
     }
   ]
 }
}


{
 "fichas_presenca": {
   "columns": [
     {
       "name": "id",
       "type": "uuid"
     },
     {
       "name": "data_atendimento",
       "type": "date"
     },
     {
       "name": "paciente_carteirinha",
       "type": "text"
     },
     {
       "name": "paciente_nome",
       "type": "text"
     },
     {
       "name": "numero_guia",
       "type": "text"
     },
     {
       "name": "codigo_ficha",
       "type": "text"
     },
     {
       "name": "possui_assinatura",
       "type": "bool"
     },
     {
       "name": "arquivo_digitalizado",
       "type": "text"
     },
     {
       "name": "observacoes",
       "type": "text"
     },
     {
       "name": "created_at",
       "type": "timestamptz"
     },
     {
       "name": "updated_at",
       "type": "timestamptz"
     },
     {
       "name": "status",
       "type": "varchar"
     }
   ]
 }
}

## Database Enums

status_divergencia:	pendente, em_analise, resolvida, cancelada
status_guia:	pendente, em_andamento, concluida, cancelada
tipo_divergencia:	ficha_sem_execucao, execucao_sem_ficha, ficha_sem_assinatura, data_divergente, guia_vencida, quantidade_excedida, falta_data_execucao
tipo_guia:	sp_sadt, consulta

## Arquivos 

database_supabase.py
# Manter apenas funções básicas de CRUD:
- salvar_dados_excel()
- listar_dados_excel() 
- listar_guias()
- buscar_guia()
- listar_fichas_presenca()
- salvar_ficha_presenca()
- limpar_banco()
- refresh_view_materializada()
- formatar_data()
# ...etc (funções de acesso direto ao banco)

auditoria_repository.py
# Manter funções específicas de divergências:
- registrar_divergencia()
- registrar_divergencia_detalhada() 
- buscar_divergencias_view()
- atualizar_ficha_ids_divergencias()
- registrar_execucao_auditoria()
- calcular_estatisticas_divergencias()
- obter_ultima_auditoria()
- atualizar_status_divergencia()

auditoria.py
# Manter apenas lógica de negócio e endpoints:
- realizar_auditoria()
- realizar_auditoria_fichas_execucoes()
- verificar_datas()
- verificar_quantidade_execucaos()
- verificar_validade_guia()
- verificar_quantidade_autorizada()
- verificar_assinatura_ficha()
- safe_get_value()
- listar_divergencias_route()