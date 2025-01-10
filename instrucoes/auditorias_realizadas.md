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


## Problemas de data

Agora está claro! O problema é que as datas estão sendo armazenadas no banco no formato YYYY-MM-DD, mas a data_atendimento não está sendo passada para a tabela de divergências.

Analisando o resultado:
1. `fichas_presenca`: data_atendimento está como "2024-11-22" (YYYY-MM-DD)
2. `execucoes`: data_execucao está como "2024-11-19" (YYYY-MM-DD)
3. `divergencias`: 
   - data_execucao está como "2024-11-18"
   - data_atendimento está como `null`

O problema está na função `registrar_divergencia_detalhada` no arquivo `auditoria.py`, onde a data_atendimento está sendo passada mas não está chegando ao banco. Veja o trecho:

```python
registrar_divergencia_detalhada({
    "numero_guia": execucao["numero_guia"],
    "tipo_divergencia": "data_divergente",
    "descricao": f"Data de atendimento ({ficha['data_atendimento']}) diferente da execução ({execucao['data_execucao']})",
    "paciente_nome": execucao["paciente_nome"] or ficha["paciente_nome"],
    "codigo_ficha": codigo_ficha,
    "data_execucao": execucao["data_execucao"],
    "data_atendimento": ficha["data_atendimento"],  # A data está sendo passada aqui
    # ...
})
```

A correção deve ser feita garantindo que a data seja mantida no formato YYYY-MM-DD ao ser inserida no banco. Em vez de tentar converter para DD/MM/YYYY nesse momento, devemos:

1. Manter as datas no formato YYYY-MM-DD no banco
2. Fazer a conversão para DD/MM/YYYY apenas na exibição (frontend ou quando necessário)

Isso evita problemas de inconsistência e facilita as queries e comparações de data no banco.


Usar endpoint https://fde1cb19-4f63-43d4-a9b7-a3d808e8d2b7-00-3cdk7z76k6er0.kirk.replit.dev/verificar-datas para ver como está 

Agora posso ver claramente que o problema está na forma como as datas estão sendo passadas na função `registrar_divergencia_detalhada`. As datas estão chegando no formato YYYY-MM-DD do banco, mas precisamos garantir que não sejam convertidas antes de salvar novamente.

Vamos corrigir a função em auditoria_repository.py:

```python



def registrar_divergencia_detalhada(divergencia: Dict) -> bool:
    """Registra uma divergência com detalhes específicos."""
    try:
        tipo = divergencia["tipo_divergencia"]
        paciente_nome = divergencia.get("paciente_nome", "PACIENTE NÃO IDENTIFICADO")
        numero_guia = divergencia.get("numero_guia", "SEM_GUIA")
        
        # Mantém as datas no formato original (YYYY-MM-DD) do banco
        data_atendimento = divergencia.get("data_atendimento")
        data_execucao = divergencia.get("data_execucao")

        # Log das datas para debug
        logging.info(f"Datas recebidas - data_atendimento: {data_atendimento}, data_execucao: {data_execucao}")
        
        # Base comum para todos os tipos de divergência
        dados = {
            "numero_guia": numero_guia,
            "tipo_divergencia": tipo,
            "paciente_nome": paciente_nome,
            "codigo_ficha": divergencia.get("codigo_ficha"),
            "data_atendimento": data_atendimento,  # Mantém o formato YYYY-MM-DD
            "data_execucao": data_execucao,  # Mantém o formato YYYY-MM-DD
            "carteirinha": divergencia.get("carteirinha"),
            "prioridade": divergencia.get("prioridade", "MEDIA"),
            "status": divergencia.get("status", "pendente"),
            "descricao": divergencia.get("descricao", "Sem descrição"),
            "detalhes": divergencia.get("detalhes"),
            "ficha_id": divergencia.get("ficha_id"),
            "execucao_id": divergencia.get("execucao_id")
        }

        # Remove campos None para evitar erro de tipo no banco
        dados = {k: v for k, v in dados.items() if v is not None}

        # Log dos dados antes do insert para debug
        logging.info(f"Registrando divergência: {dados}")
        
        return registrar_divergencia(**dados)

    except Exception as e:
        logging.error(f"Erro ao registrar divergência detalhada: {e}")
        traceback.print_exc()
        return False
```

Principais mudanças:

1. Removida a conversão de formato das datas
2. Mantidos os formatos originais vindos do banco (YYYY-MM-DD)
3. Adicionado logging para debug

Agora as datas devem ser mantidas consistentemente no formato YYYY-MM-DD no banco. A conversão para DD/MM/YYYY deve acontecer apenas no momento da exibição, que já está sendo feita corretamente na função `formatar_data` quando os dados são lidos.

A ideia é:
- Banco de dados: sempre YYYY-MM-DD
- Interface/Exibição: sempre DD/MM/YYYY usando formatar_data() ao ler os dados

Made changes.

o1.

Respire fundo.
Olhando essa função, toda a lógica de inserir o campo data_atendimento depende do parâmetro data_atendimento que chega nela. Se esse parâmetro chega vazio (ou None), então você insere NULL na tabela.

Logo, o problema não está na função em si (ela até faz a formatação da data se presente). O problema ocorre antes de chamá-la: você precisa garantir que data_atendimento seja carregada de fichas_presenca.

Possível Correção
Antes de chamar registrar_divergencia(...), consulte a tabela fichas_presenca para obter data_atendimento. Exemplo:

python
Copiar código
# Exemplo: busca o data_atendimento em fichas_presenca, caso não tenha vindo
if codigo_ficha and not data_atendimento:
    ficheiro = supabase.table("fichas_presenca") \
                       .select("data_atendimento") \
                       .eq("codigo_ficha", codigo_ficha) \
                       .single() \
                       .execute()
    if ficheiro.data:
        data_atendimento = ficheiro.data["data_atendimento"]

# Agora você chama a função com data_atendimento preenchido
registrar_divergencia(
    numero_guia=numero_guia,
    tipo_divergencia=tipo_divergencia,
    descricao=descricao,
    paciente_nome=paciente_nome,
    codigo_ficha=codigo_ficha,
    data_execucao=data_execucao,
    data_atendimento=data_atendimento,  # já não é mais None
    ...
)
Com isso, o valor que chega em registrar_divergencia() já estará corretamente populado, e a coluna data_atendimento deixará de ficar nula.












