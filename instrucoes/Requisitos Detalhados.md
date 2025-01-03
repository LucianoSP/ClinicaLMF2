**Requisitos Detalhados do Projeto de Auditoria de execucaos Médicos**

**1. Contexto Geral**

## Tipos de divergências possiveis:
Os tipos de divergências podem ser organizados de forma a abranger as principais categorias identificadas no processo de auditoria. Uma lista de tipos que podem ser cadastrados no banco de dados (por exemplo, em uma coluna tipo_divergencia) inclui:

DATA_INCONSISTENTE: Divergências envolvendo datas, como datas ausentes, divergentes entre ficha e execução ou datas fora do intervalo autorizado.

DOC_INCOMPLETO: Problemas na documentação, tais como número da guia faltando ou incorreto, código da ficha ausente ou inválido.

ASSINATURA_AUSENTE: Fichas de presença sem a devida assinatura do paciente.

QUANTIDADE_EXCEDIDA: Quando a quantidade de execuções registradas excede a quantidade autorizada na guia.

EXECUCAO_SEM_FICHA: Execuções registradas no sistema sem a ficha de presença correspondente.

FICHA_SEM_EXECUCAO: Fichas de presença digitalizadas sem execução correspondente registrada.
Você possui um aplicativo de execucaos médicos com duas tabelas principais no banco de dados:

- **Tabela de execucaos (`fichas_presenca`)**: Registra cada execucao realizado, incluindo informações como data, número da carteira, nome do beneficiário, número da guia principal, código da guia e se possui assinatura.

- **Tabela de Execuções (`execucoes`)**: Contém as guias geradas e executadas pelo plano de saúde, incluindo o ID da guia, nome do paciente, data de execução, carteirinha, ID do paciente e data de criação do registro.

**2. Objetivo do Projeto**

Desenvolver uma solução que compare as duas tabelas para identificar divergências entre os execucaos realizados e as execuções registradas pelo plano de saúde. As divergências encontradas devem ser encaminhadas para a diretoria e equipe de auditoria para correção antes de serem enviadas para protocolo.

**3. Requisitos Funcionais**

3.1. **Comparação de Registros**

- **Agrupar Registros**: Os registros devem ser agrupados pelo número da guia e data de execucao/execução.

- **Contagem de Execuções**: Determinar a quantidade de execuções para cada guia e data a partir da tabela `protocolos_excel`.

- **Verificação de execucaos Correspondentes**: Verificar se a tabela `execucaos` possui registros correspondentes em quantidade e detalhes para cada grupo identificado.

3.2. **Identificação de Inconsistências**

As inconsistências a serem identificadas incluem:

- **Datas Não Preenchidas**: execucaos onde o campo `data_execucao` está vazio ou nulo.

- **Número da Guia Não Preenchido**: execucaos onde o campo `numero_guia_principal` está vazio ou nulo, possivelmente porque o paciente estava sem guia no dia.

- **Assinaturas Ausentes ou Divergentes**: Casos em que a quantidade de assinaturas não corresponde à quantidade de execuções, seja por assinatura de quantidade abaixo ou acima do executado.

- **Quantidade de execucaos Divergente**: Quando a quantidade de execucaos registrados não corresponde à quantidade de execuções esperadas.

- **Datas Preenchidas Acima da Quantidade Executada**: Situações onde há mais datas preenchidas do que o número de execuções registradas.

3.3. **Geração de Relatórios de Divergências**

- **Registro de Divergências**: As inconsistências devem ser registradas detalhadamente para que a equipe de auditoria possa saná-las.

- **Relatórios**: Gerar relatórios claros e detalhados que possam ser encaminhados para a diretoria e equipe de auditoria.

3.4. **Exclusão de Guias com Divergências do Protocolo**

- As guias que apresentarem divergências não devem ser encaminhadas para protocolo até que as inconsistências sejam resolvidas.

**4. Requisitos Não Funcionais**

4.1. **Tecnologias Utilizadas**

- **Linguagem**: Python.

- **Framework**: FastAPI para o backend.

- **Banco de Dados**: Utilização de SQLAlchemy para interagir com o banco de dados.

4.2. **Desempenho e Eficiência**

- A solução deve ser capaz de processar grandes volumes de dados sem comprometer o desempenho.

- As consultas ao banco de dados devem ser otimizadas para eficiência.

4.3. **Escalabilidade**

- A aplicação deve ser escalável para acomodar futuros aumentos no volume de dados ou funcionalidades adicionais.

4.4. **Manutenibilidade**

- O código deve ser escrito seguindo boas práticas de programação, facilitando manutenção e atualizações futuras.

**5. Detalhamento das Tabelas**

5.1. **Tabela `execucaos`**


- **Campos**:
  - `id`: Identificador único do execucao.
  - `data_execucao`: Data em que o execucao foi realizado.
  - `numero_carteira`: Número da carteira do paciente.
  - `paciente_nome`: Nome do paciente beneficiário.
  - `numero_guia_principal`: Número da guia principal associada ao execucao.
  - `codigo_guia`: Código específico da guia.
  - `possui_assinatura`: Indica se o execucao possui assinatura (1 para verdadeiro, 0 para falso).

5.2. **Tabela `protocolos_excel`**

- **Campos**:
  - `id`: Identificador único do registro.
  - `idGuia`: Identificador da guia.
  - `nomePaciente`: Nome do paciente.
  - `dataExec`: Data de execução registrada pelo plano de saúde.
  - `carteirinha`: Número da carteirinha do paciente.
  - `idPaciente`: Identificador único do paciente.
  - `created_at`: Timestamp de quando o registro foi criado.

**6. Fluxo de Trabalho da Auditoria**

6.1. **Extração e Agrupamento de Dados**

- Extrair todos os registros da tabela `protocolos_excel`.

- Agrupar os registros por `idGuia` e `dataExec` para determinar a quantidade de execuções por guia e data.

6.2. **Verificação dos execucaos**

- Para cada grupo identificado, buscar os execucaos correspondentes na tabela `execucaos` com base em `codigo_guia` e `data_execucao`.

- Comparar a quantidade de execucaos encontrados com a quantidade de execuções esperadas.

6.3. **Identificação de Problemas Específicos**

- **Datas Não Preenchidas**: Verificar se há execucaos sem `data_execucao`.

- **Número da Guia Não Preenchido**: Identificar execucaos sem `numero_guia_principal`.

- **Assinaturas Ausentes ou Divergentes**: Verificar se `possui_assinatura` é falso ou se a quantidade de assinaturas não corresponde às execuções.

- **Quantidade Divergente de execucaos**: Comparar a quantidade de execucaos com a quantidade de execuções registradas.

- **Datas Preenchidas em Excesso**: Detectar se há mais datas preenchidas do que o número de execuções.

6.4. **Registro e Reporte de Divergências**

- Registrar todas as divergências encontradas com detalhes suficientes para permitir que a equipe de auditoria entenda e resolva os problemas.

- Gerar relatórios que incluam:
  - Identificação da guia e data.
  - Quantidade esperada de execuções.
  - Quantidade real de execucaos.
  - Detalhes das inconsistências específicas.

**7. Implementação Técnica**

7.1. **Desenvolvimento do Serviço de Auditoria**

- Criar um endpoint no FastAPI que, ao ser acionado, execute todo o processo de auditoria.

- Utilizar SQLAlchemy para interagir com o banco de dados, realizando consultas eficientes.

7.2. **Lógica de Negócio**

- Implementar a lógica para comparar os dados e identificar divergências conforme os requisitos.

- Garantir que todas as regras de negócio sejam respeitadas e que todas as inconsistências relevantes sejam detectadas.

7.3. **Geração de Relatórios**

- Os resultados da auditoria devem ser retornados em formato JSON ou armazenados em um local acessível.

- O relatório deve ser estruturado de forma clara, permitindo fácil interpretação e ação por parte da equipe de auditoria.

**8. Testes e Validação**

- Realizar testes abrangentes para garantir que a solução funciona corretamente em diversos cenários, incluindo casos com dados incompletos ou inconsistentes.

- Testar o desempenho com volumes significativos de dados para assegurar que a aplicação permanece responsiva.

**9. Documentação**

- Documentar o código e fornecer instruções claras sobre como configurar e executar o serviço.

- Incluir exemplos de uso e explicações sobre como interpretar os relatórios de divergências.

**10. Considerações Finais**

- **Integração com Processos Existentes**: A solução deve ser integrada ao fluxo de trabalho atual, garantindo que as guias com divergências sejam retidas até a resolução dos problemas.

- **Comunicação com a Equipe de Auditoria**: Estabelecer um canal claro de comunicação para o encaminhamento dos relatórios e acompanhamento das correções.

- **Escalabilidade Futura**: A solução deve ser projetada considerando possíveis expansões, como a inclusão de novas regras de validação ou integração com outros sistemas.

**11. Prazos e Entregas**

- Definir um cronograma para o desenvolvimento, incluindo marcos para o planejamento, implementação, testes e implantação.

- Estabelecer datas de entrega para cada etapa e assegurar que os recursos necessários estejam disponíveis.

**12. Responsabilidades**

- **Desenvolvedor(es)**: Responsáveis pela implementação técnica da solução conforme os requisitos.

- **Coordenador**: Fornecer orientações e validar o alinhamento da solução com os objetivos do negócio.

- **Equipe de Auditoria**: Utilizar os relatórios gerados para identificar e corrigir as inconsistências.

**Resumo**

O projeto visa criar uma ferramenta eficaz para automatizar a auditoria dos execucaos médicos, comparando registros internos com as execuções registradas pelo plano de saúde. A solução deve identificar divergências específicas, impedir que guias com problemas sejam protocoladas e fornecer relatórios detalhados para a equipe de auditoria, garantindo maior eficiência e precisão nos processos administrativos.