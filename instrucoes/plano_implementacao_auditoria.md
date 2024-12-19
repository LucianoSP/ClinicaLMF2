# Plano de Implementação - Página de Auditoria

## 1. Implementação Existente

### 1.1 Frontend (page.tsx)
- ✅ Interface com filtros de data inicial e final
- ✅ Botões para iniciar auditoria, gerar relatório e limpar divergências
- ✅ Exibição de estatísticas básicas
  - Total de protocolos
  - Total de divergências
  - Última verificação
  - Período analisado
- ✅ Tabela de divergências com paginação
- ✅ Funcionalidade para marcar divergências como resolvidas

### 1.2 Backend (auditoria.py)
- ✅ Função `realizar_auditoria()`: Verifica protocolos vs execucaos
- ✅ Função `realizar_auditoria_fichas_execucoes()`: Verifica fichas vs execuções

### 1.3 Verificações Implementadas
- ✅ Fichas sem execução correspondente
- ✅ Execuções sem ficha correspondente
- ✅ Fichas sem assinatura
- ✅ Divergências de datas entre fichas e execuções
- ✅ Contagem de divergências por tipo

## 2. Melhorias a Serem Implementadas

### 2.1 Verificações Adicionais
- [ ] Verificação de Guias (tabela `guias`)
  - [ ] Validar `quantidade_autorizada` vs `quantidade_executada`
  - [ ] Verificar `data_validade` das guias
  - [ ] Conferir `status` das guias
  - [ ] Validar `procedimento_codigo` e `procedimento_nome`
- [ ] Verificação de Carteirinhas (tabela `carteirinhas`)
  - [ ] Validar `data_validade` da carteirinha
  - [ ] Conferir `titular` e `nome_titular`
  - [ ] Verificar vínculo com plano de saúde
- [ ] Verificação de Agendamentos (tabela `agendamentos`)
  - [ ] Conferir `saldo_sessoes`
  - [ ] Validar `status` do agendamento
  - [ ] Verificar `falta_profissional`
  - [ ] Conferir `codigo_faturamento`

### 2.2 Melhorias na Interface
- [ ] Filtros Avançados
  - [ ] Por plano de saúde (`planos_saude`)
  - [ ] Por tipo de guia
  - [ ] Por status de divergência
  - [ ] Por profissional executante
- [ ] Estatísticas Detalhadas
  - [ ] Gráfico de divergências por tipo usando `divergencias_por_tipo` da tabela `auditoria_execucoes`
  - [ ] Estatísticas por plano de saúde
  - [ ] Taxa de resolução de divergências
- [ ] Visualização de Documentos
  - [ ] Visualizador de fichas digitalizadas (`arquivo_digitalizado`)
  - [ ] Histórico de alterações
  - [ ] Anotações e observações

### 2.3 Funcionalidades Extras
- [ ] Gestão de Divergências
  - [ ] Atribuição de responsáveis
  - [ ] Prazo para resolução
  - [ ] Notificações automáticas
  - [ ] Histórico de alterações
- [ ] Relatórios Avançados
  - [ ] Por período
  - [ ] Por tipo de divergência
  - [ ] Por plano de saúde
  - [ ] Por profissional
- [ ] Integração com Agendamentos
  - [ ] Validação automática com agenda
  - [ ] Controle de faltas
  - [ ] Saldo de sessões

### 2.4 Validações e Tratamento de Erros
- [ ] Validações de Dados
  - [ ] Formato de carteirinha
  - [ ] Códigos de procedimento
  - [ ] Datas válidas
  - [ ] Quantidade de sessões
- [ ] Tratamento de Erros
  - [ ] Logs detalhados
  - [ ] Notificações de erro
  - [ ] Recuperação automática
- [ ] Consistência de Dados
  - [ ] Entre tabelas relacionadas
  - [ ] Histórico de alterações
  - [ ] Backup automático

### 2.5 Documentação
- [ ] Documentação Técnica
  - [ ] Estrutura do banco de dados
  - [ ] Fluxo de auditoria
  - [ ] APIs e endpoints
- [ ] Manual do Usuário
  - [ ] Processos de auditoria
  - [ ] Resolução de divergências
  - [ ] FAQ
- [ ] Documentação de Processos
  - [ ] Fluxos de trabalho
  - [ ] Políticas de auditoria
  - [ ] Boas práticas

## 3. Priorização

### Alta Prioridade
1. Verificação de Execuções vs Fichas
   - [ ] Validar quantidade de sessões executadas vs fichas de presença
   - [ ] Verificar correspondência de datas
   - [ ] Conferir assinaturas nas fichas
   - [ ] Validar códigos das fichas

### Média Prioridade
1. Filtros Avançados na Interface
   - [ ] Por tipo de divergência
   - [ ] Por período
   - [ ] Por status
2. Estatísticas Detalhadas
3. Validações de Dados
4. Documentação Técnica

### Baixa Prioridade
1. Relatórios Avançados
2. Notificações Automáticas
3. Manual do Usuário
4. Documentação de Processos

## 4. Próximos Passos

1. Implementar verificação de quantidade de sessões vs fichas
2. Desenvolver filtros por tipo de divergência
3. Implementar validações de dados
4. Documentar alterações realizadas
