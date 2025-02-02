```mermaid
erDiagram
    aba_areas {
        number area_id PK
        string area_nome
        string area_descricao
        date area_registration_date
        string area_lastupdate
    }
    aba_atividades {
        number atividade_id PK
        string atividade_nome
        string atividade_descricao
        string atividade_image
        number atividade_brinquedo
        date atividade_registration_date
        string atividade_lastupdate
    }
    aba_atividades_x_programas {
        number id PK
        number programa_id
        number atividade_id
    }
    aba_programas {
        number programa_id PK
        number area_id
        string programa_nome
        number programa_avaliacao
        string programa_objetivo
        string programa_procedimento
        string programa_imagem_procedimento
        string programa_descricao
        string programa_como_realizar
        string programa_resposta_da_crianca
        string programa_consequencia_reforcadora
        date programa_registration_date
        string programa_lastupdate
    }
    agendas_profissionais {
        number agenda_profissional_id PK
        number agenda_profissional_user_id
        number agenda_profissional_unidade
        string agenda_profissional_dia
        string agenda_profissional_horario_inicial
        string agenda_profissional_horario_final
        date agenda_profissional_registration_date
        string agenda_profissional_lastupdate
    }
    anamnese_pergunta {
        number anamnese_pergunta_id PK
        string pergunta
        string tipo_resposta
        string categoria_pergunta
        number ativa
        date created_at
        date updated_at
    }
    anamnese_resposta {
        number anamnese_resposta_id PK
        number anamnese_pergunta_id
        string resposta
        string pergunta
        string tipo_resposta
        number anamnese_id
        number paciente_id
        date created_at
        date updated_at
    }
    bancos {
        number banco_id PK
        string banco_codigo
        string banco_name
    }
    conselhos {
        number conselho_id PK
        string conselho_nome
        string conselho_status
    }
    contatos_emergencia {
        number contato_emergencia_id PK
        string contato_emergencia_tipo
        string contato_emergencia_nome
        string contato_emergencia_telefone
        string contato_emergencia_email
        number contato_emergencia_user_id
        date contato_emergencia_registration_date
        string contato_emergencia_lastupdate
    }
    dados_bancarios {
        number dados_bancario_id PK
        number dados_bancario_client_id
        number dados_bancario_banco_id
        string dados_bancario_agencia
        string dados_bancario_conta
        string dados_bancario_titular_cpf_cnpj
        string dados_bancario_tipo_de_chave_pix
        string dados_bancario_chave_pix
        date dados_bancario_registration_date
        string dados_bancario_lastupdate
    }
    filhos_usuarios {
        number filho_usuario_id PK
        number filho_usuario_user_id
        string filho_usuario_nome
        string filho_usuario_sexo
        date filho_usuario_data_nascimento
    }
    historico_titulacoes {
        number historico_titulacao_id PK
        number historico_titulacao_user_id
        number historico_titulacao_titulacao_id
        string historico_titulacao_anexo
        date historico_titulacao_data_conclusao
        date historico_titulacao_registration_date
        string historico_titulacao_lastupdate
    }
    lur_habilidades_luria {
        number habilidade_id PK
        string habilidade_codigo
        string habilidade_descricao
        string habilidade_acao
        string habilidade_orientacao
    }
    lur_habilidades_luria_clients {
        number habilidade_luria_client_id PK
        number habilidade_id
        number ps_cliente_id
        date habilidade_luria_client_data_inicio
        date habilidade_luria_client_data_andamento
        string habilidade_luria_client_data_dominio
        date habilidade_luria_client_registration_date
        string habilidade_luria_client_lastupdate
    }
    mbm_aba_areas {
        number area_id PK
        string area_nome
        string area_descricao
        date area_registration_date
        string area_lastupdate
    }
    mbm_aba_execucao {
        number execucao_id PK
        date execucao_data
        number execucao_user_id
        number execucao_qtd_sessoes
        number execucao_paciente_id
        number execucao_insert_user_id
        number schedule_id
        string execucao_hr_inicial
        string execucao_hr_final
        date execucao_nova_data
    }
    mbm_aba_atividades {
        number atividade_id PK
        string atividade_nome
        string atividade_descricao
        string atividade_image
        number atividade_brinquedo
        date atividade_registration_date
        string atividade_lastupdate
    }
    mbm_aba_atv_prg {
        number id PK
        number programa_id
        number atividade_id
    }
    mbm_aba_comportamentos {
        number comportamento_id PK
        string comportamento_nome
        string comportamento_descricao
        date comportamento_registration_date
        string comportamento_lastupdate
    }
    mbm_aba_patient_consults {
        number consult_id PK
        number consult_pacient
        date consult_date_start
        date consult_date_end
        number last_consult_id
    }
    mbm_aba_patient_programa_consultas {
        number prog_cons_id PK
        number programa_id
        number consulta_id
        number area_profissional_id
        number responsavel_id
        number area_id
        number atividade_id
        string status
        string del
        number user_id
        date registration_date
        date lastupdate
    }
    mbm_aba_programas {
        number programa_id PK
        number area_id
        string programa_nome
        number programa_avaliacao
        string programa_objetivo
        string programa_procedimento
        string programa_imagem_procedimento
        string programa_descricao
        string programa_como_realizar
        string programa_resposta_da_crianca
        string programa_consequencia_reforcadora
        date programa_registration_date
        string programa_lastupdate
    }
    mbm_aba_validate_answers {
        number validate_id PK
        number validate_paciente
        number validate_programa
        number validate_atividade
        number validate_comportamento
        number validate_comportamento_qtd
        number validate_tempo_espera
        number validate_tipo_tempo_espera
        number validate_qtd_recusa
        number validate_qtd_fisica_total
        number validate_qtd_fisica_parcial
        number validate_qtd_dica_fisica
        number validate_qtd_dica_verbal
        number validate_qtd_indep
        number validate_consulta_id
        string validate_obs
        number validate_execucao_id
        number validate_habilidade_adquirida
        string validate_habilidade_adquirida_aprovada
        number validate_qtd_dica_gestual
        number validate_frequencia
        string validate_duracao_comportamento
    }
    mbm_clients_videos {
        number video_id PK
        number client_id
        date video_date
        string video_url
        string video_description
        date video_registration_date
        string video_lastupdate
    }
    mbm_clients_videos_tutorial {
        number video_id PK
        number client_id
        string video_title
        date video_date
        string video_url
        string video_description
        date video_registration_date
        string video_lastupdate
    }
    ps_anamnese {
        number anamnese_id PK
        number anamnese_paciente_id
        date anamnese_data_medicamentos
        string anamnese_medicamentos
        string anamnese_medico
        string anamnese_plano_terapeutico
        string anamnese_consideracoes_supervisor
        number anamnese_profissional_id
        date anamnese_registration_date
        string anamnese_lastupdate
        string anamnese_tempo_meta
        number anamnese_psicologia_qtde
        number anamnese_fonoaudiologia_qtde
        number anamnese_terapia_ocupacional_qtde
        string anamnese_outros_qtde
    }
    ps_anamnese_itens {
        number anamnese_item_id PK
        string anamnese_item_descricao
        number anamnese_id
    }
    ps_avaliacoes {
        number avaliacao_id PK
        string avaliacao_nome
        string avaliacao_status
        date avaliacao_registration_date
        string avaliacao_lastupdate
    }
    ps_care_rooms {
        number room_id PK
        string room_name
        string room_description
        number room_type
        number room_status
        date room_registration_date
        string room_lastupdate
        number room_local_id
        number multiple
        number room_capacidade
    }
    ps_clients {
        number client_id PK
        string client_cpf
        string client_rg
        string client_nome
        date client_data_nascimento
        string client_thumb
        string client_nome_responsavel
        string client_nome_pai
        string client_nome_mae
        string client_sexo
        string client_cep
        string client_endereco
        number client_numero
        string client_complemento
        string client_bairro
        string client_cidade_nome
        number client_cidade
        string client_state
        number client_payment
        float consult_value
        number client_professional
        string client_escola_nome
        string client_escola_ano
        string client_escola_professor
        string client_escola_periodo
        string client_escola_contato
        date client_registration_date
        string client_update_date
        number client_status
        number client_patalogia_id
        string client_tem_supervisor
        number client_supervisor_id
        string client_tem_avaliacao_luria
        date client_avaliacao_luria_data_inicio_treinamento
        string client_avaliacao_luria_reforcadores
        string client_avaliacao_luria_obs_comportamento
        string client_numero_carteirinha
        string client_cpf_cli
        string client_crm_medico
        string client_nome_medico
        string client_pai_nao_declarado
    }
    ps_clients_atividades_digitalizadas {
        number atividade_digitalizada_id PK
        number client_id
        string atividade_digitalizada_nome
        date atividade_digitalizada_data
        date atividade_digitalizada_registration_date
        string atividade_digitalizada_path
        number atividade_digitalizada_type
    }
    ps_clients_attachments {
        number attachment_id PK
        number client_id
        string attachment_name
        date attachment_registration_date
        string attachment_path
        number attachment_type
    }
    ps_clients_avaliacoes {
        number client_avaliacao_id PK
        number avaliacao_id
        number client_id
    }
    ps_clients_contatos {
        number client_contato_id PK
        number client_id
        number client_contato_tipo
        string client_contato_nome
        string client_contato_email
        string client_contato_senha
        string client_contato_telefone
        string client_contato_cpf
        string client_contato_status
    }
    ps_clients_evolution {
        number evolution_id PK
        number client_id
        number professional_id
        number schedule_id
        date evolution_date
        string evolution_description
        date evolution_registration_date
        string evolution_lastupdate
        date evolution_new_date
        string evolution_hour_start
        string evolution_hour_end
    }
    ps_clients_faltas {
        number falta_id PK
        number falta_client_id
        number falta_schedule_id
        number falta_attachment_id
        number falta_tipo
        date falta_registration_date
        string falta_lastupdate
    }
    ps_clients_pagamentos {
        number client_pagamento_id PK
        number client_id
        number pagamento_id
    }
    ps_clients_pro_history {
        number pro_id PK
        number client_id
        string pro_type
        string pro_name
        string pro_obs
        date pro_registration_date
        string pro_lastupdate
    }
    ps_clients_professional {
        number professional_id PK
        number user_id
        number client_id
    }
    ps_clients_reports {
        number laudo_id PK
        number client_id
        string laudo_nome
        number laudo_tipo
        date laudo_data
        date laudo_registration_date
        string laudo_path
        number laudo_type
    }
    ps_financial_accounts {
        number account_id PK
        string account_name
        date account_registration_date
        string account_lastupdate
    }
    ps_financial_categories {
        number category_id PK
        number category_type
        number category_parent
        string category_name
        string category_title
        string category_content
        string category_date
    }
    ps_financial_expenses {
        number expense_id PK
        string expense_title
        number expense_supplier
        number expense_category_id
        float expense_value
        date expense_issue_date
        date expense_due_date
        date expense_payment_date
        number expense_receipt_type
        string expense_receipt_number
        number expense_account_id
        string expense_description
        date expense_registration_date
        string expense_lastupdate
        number expense_status
    }
    ps_financial_revenues {
        number revenue_id PK
        string revenue_title
        number revenue_pacient_id
        number revenue_category_id
        date revenue_date
        number revenue_receive_type
        float revenue_value
        number revenue_account_id
        string revenue_description
        number revenue_status
        date revenue_registration_date
        string revenue_lastupdate
    }
    ps_financial_suppliers {
        number supplier_id PK
        string supplier_name
        string supplier_doc
        string supplier_responsible
        string supplier_phone
        string supplier_address
        string supplier_obs
        date supplier_registration_date
        string supplier_lastupdate
    }
    ps_locales {
        number local_id PK
        string local_nome
        string local_endereco
        string local_cidade
        string local_uf
        string local_status
        date local_registration_date
        string local_lastupdate
    }
    ps_log_actions {
        number log_id PK
        string log_operation
        number user_id
        string log_date
        string log_table
        string log_description
        string log_row_before_complete
        string log_row_complete
        number log_reference_id
    }
    ps_registros_guias {
        number registro_guia_id PK
        number registro_guia_pagamento_id
        number registro_guia_client_id
        number registro_guia_numero
        date registro_guia_data_autorizacao
        string registro_guia_senha
        date registro_guia_data_validade_senha
        number registro_guia_numero_sessoes_autorizada
        string registro_guia_status
        string registro_guia_finalizada
        date registro_guia_data_1
        date registro_guia_data_2
        date registro_guia_data_3
        date registro_guia_data_4
        date registro_guia_data_5
        date registro_guia_data_6
        date registro_guia_data_7
        date registro_guia_data_8
        date registro_guia_data_9
        date registro_guia_data_10
        date registro_guia_registration_date
        date registro_guia_lastupdate
    }
    ps_registros_guias_datas {
        number registro_guia_data_id PK
        number registro_guia_data_numero
        date registro_guia_data
    }
    ps_schedule {
        number schedule_id PK
        date schedule_date_start
        date schedule_date_end
        number schedule_pacient_id
        number schedule_pagamento_id
        number schedule_room_id
        number schedule_qtd_sessions
        number schedule_status
        float schedule_room_rent_value
        string schedule_fixed
        number schedule_especialidade_id
        number schedule_local_id
        number schedule_saldo_sessoes
        string schedule_elegibilidade
        string schedule_falta_do_profissional
        number schedule_parent_id
        date schedule_registration_date
        string schedule_lastupdate
        number parent_id
        string schedule_codigo_faturamento
    }
    ps_schedule_blocked {
        number schedule_id PK
        number schedule_professional_id
        date schedule_date_start
        date schedule_date_end
        number schedule_pacient_id
        number schedule_room_id
        number schedule_qtd_sessions
        number schedule_status
        float schedule_room_rent_value
        string schedule_fixed
        date schedule_registration_date
        string schedule_lastupdate
        number schedule_local_id
    }
    ps_schedule_pacients {
        number id PK
        number pacient_id
        number schedule_id
    }
    ps_schedule_professionals {
        number id PK
        number professional_id
        number schedule_id
        string substituido
    }
    ps_schedule_professionals_blocked {
        number id PK
        number professional_id
        number schedule_id
    }
    ra_relatorio_medico {
        number relatorio_id PK
        number relatorio_client_id
        date relatorio_data_laudo
        string relatorio_arquivo_laudo
        number relatorio_arquivo_laudo_id
        number relatorio_qtde_fisioterapia
        number relatorio_qtde_fonoaudiologia
        number relatorio_qtde_musicoterapia
        number relatorio_qtde_neuropedagogia
        number relatorio_qtde_psicopedagogia
        number relatorio_qtde_psicologia
        number relatorio_qtde_psicomoticidade
        number relatorio_qtde_terapia_ocupacional
        date relatorio_data_validade
        string relatorio_registration_date
    }
    ra_relatorio_mensal_amil {
        number amil_id PK
        number amil_client_id
        string amil_client_carteirinha
        string amil_liminar
        number amil_patologia_id
        string amil_atividade_desenvolvida
        number amil_horas_mensais
        number amil_horas_psicologia
        number amil_horas_terapia_ocupacional
        number amil_horas_fonoaudiologia
        number amil_horas_fisioterapia
        number amil_horas_equoterapia
        string amil_outras_terapias
        string amil_outra_horas_semanal
        string amil_evolucao_paciente
        date amil_data_cadastro
    }
    ra_relatorio_mensal_ipasgo {
        number ipasgo_id PK
        number ipasgo_profissional_execucao
        number ipasgo_tipo_terapia
        string ipasgo_justificativa_periodo_tratamento
        string ipasgo_evolucao_paciente
        date ipasgo_data
        number client_id
        number user_id
    }
    ra_tratativas_faltas {
        number tratativa_falta_id PK
        string tratativa_falta_termo_assinado
        number tratativa_falta_client_id
        string tratativa_falta_tipo_contato
        number tratativa_falta_quem_realizou
        string tratativa_falta_descricao
        string tratativa_falta_definicao
        date tratativa_falta_data
    }
    sys_permissions {
        number id PK
        string name
        string label
        string parent
        number permission
        date created_at
    }
    teste_perfil_sensorial {
        number perfil_sensorial_id PK
        number perfil_sensorial_paciente_id
        string perfil_sensorial_serie_ecolar
        string perfil_sensorial_respondido_por
        string perfil_sensorial_parentesco_crianca
        date perfil_sensorial_data_avaliacao
        date perfil_sensorial_registration_date
    }
    teste_perfil_sensorial_pacientes {
        number sensorial_paciente_id PK
        number perfil_sensorial_id
        number sensorial_id
        number ps_client_id
        number sensorial_paciente_ponto
        date sensorial_paciente_registration_date
        string sensorial_paciente_lastupdate
    }
    teste_perfil_sensorial_perguntas {
        number sensorial_id PK
        string sensorial_classificacao
        string sensorial_item
        number sensorial_fator
        number sensorial_sessao
    }
    teste_vineland {
        number vineland_id PK
        string vineland_area
        string vineland_habilidade
        string vineland_item
    }
    teste_vineland_pacientes {
        number vineland_paciente_id PK
        number vineland_id
        number ps_client_id
        number vineland_paciente_ponto
        date vineland_paciente_registration_date
        string vineland_paciente_lastupdate
    }
    ws_certificados {
        number certificado_id PK
        number certificado_ws_user_id
        string certificado_tipo
        string certificado_nome
        string certificado_nome_instituicao
        date certificado_data_inicio
        date certificado_data_fim
        string certificado_qtde_horas
        string certificado_arquivo
        number certificado_arquivo_id
        date certificado_registration_date
    }
    ws_config {
        number conf_id PK
        string conf_key
        string conf_value
        string conf_type
    }
    ws_config_profiles {
        number profile_id PK
        string profile_name
        date profile_registration_date
        string profile_lastupdate
        number profile_status
    }
    ws_config_profiles_permissions {
        number pp_id PK
        number profile_id
        string pp_app
        number pp_crud
    }
    ws_especialidades {
        number especialidade_id PK
        string especialidade_name
        string especialidade_anexo
        string especialidade_status
    }
    ws_lista_espera {
        number ws_lista_id PK
        date ws_lista_data_solicitacao
        string ws_lista_convenio
        string ws_lista_nome_paciente
        string ws_lista_nome_responsavel
        string ws_lista_telefone_contato
        string ws_lista_data_nascimento
        string ws_lista_cpf
        string ws_lista_periodo_execucao
        string ws_lista_guia
        string ws_lista_relatorio_medico_file
        string ws_lista_relatorio_medico
        string ws_lista_tea
        string ws_lista_pagamento_cooparticipacao
        string ws_lista_aplicativo
        string ws_lista_diagnostico
        string ws_lista_horas
        string ws_lista_situacao
        string ws_lista_observacao
        number ws_lista_colaborador_responsavel
        date ws_lista_data_agendamento
    }
    ws_lista_espera_temp {
        string id PK
        string convenio
        string nome_paciente
        string nome_responsavel
        string telefone_contato
        string data_nascimento
        string cpf
        string periodo_execucao
        string relatorio_medico
        string guia
        string tea
        string pagamento_cooparticipacao
        string aplicativo
        date created_at
    }
    ws_mudanca_horario {
        number ws_mudanca_id PK
        date ws_mudanca_data_solicitacao
        string ws_mudanca_unidade
        string ws_mudanca_nome_paciente
        string ws_mudanca_telefone_contato
        string ws_mudanca_tipo
        string ws_mudanca_especialidade
        string ws_mudanca_dia_semana
        string ws_mudanca_hora
        string ws_mudanca_descricao_solicitacao
        string ws_mudanca_descricao_andamento
        string ws_mudanca_situacao
        string ws_mudanca_observacao
    }
    ws_mudanca_horario_temp {
        string id PK
        string unidade
        string nome_paciente
        string tipo
        string telefone_contato
        string especialidade
        string dia_semana
        string hora
        string descricao_solicitacao
        date created_at
    }
    ws_noticias {
        number noticia_id PK
        string noticia_tipo
        string noticia_titulo
        string noticia_descricao
        date noticia_data
        string noticia_file
        string noticia_nivel
        number setor_id
        string noticia_carrossel
        date noticia_registration_date
        string noticia_lastupdate
    }
    ws_pagamentos {
        number pagamento_id PK
        string pagamento_name
        string pagamento_carteirinha_obrigatoria
        string pagamento_status
    }
    ws_pagamentos_x_codigos_faturamento {
        number codigo_faturamento_id PK
        string codigo_faturamento_numero
        number pagamento_id PK
        string codigo_faturamento_descricao
    }
    ws_patologia {
        number patologia_id PK
        string patologia_name
        string patologia_status
    }
    ws_patologia_cliente {
        number patologia_cliente_id PK
        number client_id
        number patologia_id
    }
    ws_profissoes {
        number profissao_id PK
        string profissao_name
        string profissao_status
    }
    ws_profissoes_rooms {
        number id PK
        number profissao_id
        number room_id
        number room_local_id
        number room_qtde
    }
    ws_setores {
        number setor_id PK
        string setor_name
        string setor_status
    }
    ws_siteviews_online {
        number online_id PK
        number online_user
        string online_name
        string online_startview
        string online_endview
        string online_ip
        string online_url
        string online_agent
    }
    ws_siteviews_views {
        number views_id PK
        date views_date
        float views_users
        float views_views
        float views_pages
    }
    ws_tipos_desagendamentos {
        number desagendamento_id PK
        string desagendamento_nome
        string desagendamento_contabilizar
        string desagendamento_status
        string desagendamento_tipo
        string desagendamento_anexar
    }
    ws_titulacoes {
        number titulacao_id PK
        string titulacao_nome
        string titulacao_supervirora
        string titulacao_status
    }
    ws_users {
        number user_id PK
        string user_thumb
        string user_name
        string user_lastname
        string user_document
        number user_genre
        date user_datebirth
        string user_telephone
        string user_cell
        string user_email
        string user_password
        string user_channel
        string user_registration
        string user_lastupdate
        string user_lastaccess
        string user_login
        string user_login_cookie
        number user_client
        number user_level
        number user_profile
        string user_facebook
        string user_twitter
        string user_youtube
        string user_google
        string user_blocking_reason
        number user_franchise
        float user_price_external
        float user_price_internal
        number user_status
        string user_profission_name
        string user_supervisor
        number user_titulacao_id
        number user_sala_fixa
        string user_foto_assinatura
        string user_registro_conselho
        number user_conselho_id
        string user_conselho_uf
        number user_tipo_pagamento_id
        string user_escolaridade
        date user_data_admissao
        number user_setor_id
        string user_estado_civil
    }
    ws_users_address {
        number user_id
        number addr_id PK
        number addr_key
        string addr_name
        string addr_zipcode
        string addr_street
        string addr_number
        string addr_complement
        string addr_district
        string addr_city
        string addr_state
        string addr_country
    }
    ws_users_attachments {
        number attachments_id PK
        number user_id
        string attachments_name
        date attachments_registration_date
        string attachments_path
        number attachments_type
    }
    ws_users_especialidades {
        number id PK
        number user_id
        number especialidade_id
    }
    ws_users_locales {
        number user_id
        number local_id
    }
    ws_users_notes {
        number note_id PK
        number user_id
        number admin_id
        string note_text
        string note_datetime
        number note_status
    }
    ws_users_pagamentos {
        number id PK
        number user_id
        number pagamento_id
    }
    ws_users_permissions {
        number permission_id PK
        number user_id
        string permission_app
        number permission_crud
    }
    ws_users_profissoes {
        number id PK
        number user_id
        number profissao_id
    }
    ws_users_titulacoes {
        number id PK
        number user_id
        number titulacao_id
    }
    ws_users_address |o--|| ws_users : references
    ws_users_notes |o--|| ws_users : references
    ws_users_notes |o--|| ws_users : references
```