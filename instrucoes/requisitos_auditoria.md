# Requisitos de Auditoria - Sistema de execucaos Médicos

## 1. Contexto Geral

O sistema possui duas tabelas principais no banco de dados:

- **Tabela de Fichas de Presença (`fichas_presenca`)**: Registra cada execucao realizado, incluindo:
  - data_execucao
  - numero_carteira
  - nome_beneficiario
  - numero_guia_principal
  - codigo_ficha
  - possui_assinatura
  - datas_execucao

- **Tabela de Execuções (`execucoes`)**: Contém as guias executadas pelo plano de saúde, incluindo:
  - id_guia
  - nome_paciente
  - data_execucao
  - carteirinha
  - id_paciente
  - codigo_ficha
  - data_criacao

## 2. Verificações de Auditoria

### 2.1. Verificações por Ficha
- Cada execucao deve ter uma ficha de presença preenchida
- Cada ficha deve ter um `codigo_ficha` único
- O número de execuções na tabela `execucoes` deve corresponder exatamente ao número de execucaos na ficha
- O `codigo_ficha` deve ser idêntico em ambas as tabelas

### 2.2. Verificações de Datas e Guias
- A `data_execucao` na tabela `execucoes` deve ser igual à `data_execucao` na tabela `fichas_presenca`
- O `numero_guia` deve ser idêntico em ambas as tabelas
- Todas as datas de execucao devem estar devidamente preenchidas

### 2.3. Verificações de Assinaturas
- Cada execucao realizado deve ter uma assinatura correspondente
- A quantidade de assinaturas deve corresponder à quantidade de execuções

## 3. Tipos de Divergências a Serem Identificadas

1. **Divergências de Datas**
   - Datas não preenchidas
   - Datas divergentes entre execução e execucao
   - Datas preenchidas acima da quantidade executada

2. **Divergências de Documentação**
   - Número da guia não preenchido ou divergente
   - Código da ficha não preenchido ou divergente
   - Assinaturas ausentes

3. **Divergências Quantitativas**
   - Quantidade de execucaos diferente da quantidade de execuções
   - Quantidade de assinaturas não correspondente às execuções