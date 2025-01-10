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


-- Tabela de divergências
CREATE TABLE divergencias (
    id uuid PRIMARY KEY,
    numero_guia text,
    data_execucao date,
    codigo_ficha text,
    tipo_divergencia tipo_divergencia,
    descricao text,
    status status_divergencia,
    data_identificacao timestamptz,
    data_resolucao timestamptz,
    resolvido_por uuid,
    observacoes text,
    created_at timestamptz,
    updated_at timestamptz,
    paciente_nome text,
    ficha_id uuid,
    execucao_id uuid,
    prioridade text,
    detalhes jsonb,
    data_atendimento date,
    carteirinha varchar
);

-- Tabela de execuções
CREATE TABLE execucoes (
    id uuid PRIMARY KEY,
    numero_guia text,
    paciente_nome text,
    data_execucao date,
    paciente_carteirinha text,
    paciente_id text,
    usuario_executante uuid,
    created_at timestamptz,
    updated_at timestamptz,
    codigo_ficha text
);

-- Tabela de fichas de presença
CREATE TABLE fichas_presenca (
    id uuid PRIMARY KEY,
    data_atendimento date,
    paciente_carteirinha text,
    paciente_nome text,
    numero_guia text,
    codigo_ficha text,
    possui_assinatura bool,
    arquivo_digitalizado text,
    observacoes text,
    created_at timestamptz,
    updated_at timestamptz,
    status varchar
);
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