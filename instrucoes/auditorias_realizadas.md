# Resumo das Divergências no Código

## Tipos de Divergências (tipo_divergencia)

1. `data_divergente`: Quando a data_execucao é diferente da data_sessao
2. `sessao_sem_assinatura`: Quando uma sessão específica não possui assinatura
3. `execucao_sem_sessao`: Quando há execução sem sessão correspondente
4. `sessao_sem_execucao`: Quando há sessão sem execução correspondente
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

## 2. Sessão sem Assinatura (sessao_sem_assinatura)

* Descrição: Quando uma sessão específica dentro da ficha não possui assinatura do paciente
* Campo chave: codigo_ficha + data_sessao
* Campos verificados:
  * fichas_presenca.assinaturas_sessoes (JSON contendo status de assinatura por data)
  * execucoes.data_execucao

## 3. Execução sem Sessão (execucao_sem_sessao)

* Descrição: Quando existe uma execução mas não há sessão correspondente
* Campo chave: codigo_ficha + data_sessao
* Campos verificados:
  * execucoes.codigo_ficha
  * execucoes.data_execucao

## 4. Sessão sem Execução (sessao_sem_execucao)

* Descrição: Quando existe uma sessão mas não há execução correspondente
* Campo chave: codigo_ficha + data_sessao
* Campos verificados:
  * sessoes.codigo_ficha
  * sessoes.data_sessao

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


