from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
from datetime import datetime
import time
import os
import random
from dotenv import load_dotenv
import re  # Se for utilizar regex na validação de datas


load_dotenv()


class UnimedAutomation:
    def __init__(self):
        self.driver = None
        self.wait = None
        self.captured_guides = []

    def setup_driver(self):
        """Configura e inicializa o Chrome em modo headless"""
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-infobars")

        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        self.wait = WebDriverWait(self.driver, 20)  # Aumentado para 20 segundos
        return self.driver

    def random_wait(self, min_seconds: float = 0.5, max_seconds: float = 1):
        """Tempos reduzidos para teste"""
        time.sleep(random.uniform(min_seconds, max_seconds))

    def login(self, username: str, password: str):
        """Realiza login no sistema"""
        try:
            print("Iniciando processo de login...")
            self.driver.get("https://sgucard.unimedgoiania.coop.br/cmagnet/Login.do")

            login_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "login"))
            )
            login_field.clear()
            login_field.send_keys(username)
            print("Usuário preenchido")

            password_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "passwordTemp"))
            )
            password_field.clear()
            password_field.send_keys(password)
            print("Senha preenchida")

            login_button = self.wait.until(
                EC.element_to_be_clickable((By.ID, "Button_DoLogin"))
            )
            login_button.click()
            print("Botão de login clicado")

            self.random_wait(2, 3)
            self.driver.save_screenshot("login_result.png")
            print("Login realizado e screenshot salvo")

            return True
        except Exception as e:
            print(f"Erro durante o login: {str(e)}")
            self.driver.save_screenshot("login_error.png")
            return False

    def navigate_to_finished_exams(self):
        """Navega para a tela de exames finalizados"""
        try:
            # Primeira tentativa: procura pelo link dentro do td
            finished_exams = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "td#centro_21 a"))
            )
            print("Encontrou o link de exames finalizados")

            # Clica no elemento
            finished_exams.click()
            self.driver.save_screenshot("tela_exames_finalizados.png")
            print("Clicou no link de exames finalizados")

            # Aguarda um momento para a página carregar
            self.random_wait()

            return True

        except Exception as e:
            print(f"Erro ao navegar para exames finalizados: {str(e)}")
            self.driver.save_screenshot("erro_navegacao_exames_finalizados.png")
            return False

    def search_guide(self, guide_number: str):
        """Busca uma guia específica usando o formulário de busca"""
        try:
            # Localiza o campo de número da guia usando o XPath correto
            guide_input = self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="filtro"]/table/tbody/tr[3]/td[4]/input')
                )
            )

            # Limpa o campo e insere o número da guia
            guide_input.clear()
            self.random_wait(0.5, 1)
            guide_input.send_keys(guide_number)
            print(f"Número da guia {guide_number} inserido no campo de busca")

            # Localiza e clica no botão Filtrar usando o XPath correto
            filter_button = self.wait.until(
                EC.element_to_be_clickable(
                    (By.XPATH, '//*[@id="filtro"]/table/tbody/tr[7]/td/input[3]')
                )
            )
            filter_button.click()
            print("Botão Filtrar clicado")

            # Aguarda a tabela de resultados carregar
            self.driver.save_screenshot("filtro_realizado.png")
            self.random_wait()

            return True

        except Exception as e:
            print(f"Erro ao buscar guia: {str(e)}")
            self.driver.save_screenshot("erro_busca_guia.png")
            return False

    def search_and_get_guide_dates(self, guide_number: str):
        """Busca uma guia específica e captura suas datas de atendimento"""
        try:
            # Realiza a busca da guia
            if not self.search_guide(guide_number):
                raise Exception("Falha ao buscar a guia")

            guide_dates = []

            # Aguarda a tabela aparecer usando o XPath mais específico
            base_xpath = '//*[@id="conteudo"]/form[2]/table/tbody'
            table = self.wait.until(
                EC.presence_of_element_located((By.XPATH, base_xpath))
            )

            # Encontrar todas as linhas, começando da segunda (índice 2 no XPath pois tbody/tr[1] é o cabeçalho)
            rows = table.find_elements(By.TAG_NAME, "tr")

            for row in rows[1:]:  # Ignora o cabeçalho
                try:
                    date_element = row.find_element(By.XPATH, "./td[1]")
                    guide_number_element = row.find_element(By.XPATH, "./td[2]/a")

                    # Extrai apenas a data (sem o horário)
                    date_time = date_element.text.strip()
                    date = date_time.split()[0]  # Pega apenas a parte da data

                    # Armazena informações estáveis para localizar o link novamente
                    guide_dates.append(
                        {
                            "date": date,
                            "guide_number_text": guide_number_element.text.strip(),
                        }
                    )
                    print(f"Data encontrada: {date}")

                except NoSuchElementException:
                    continue
                except Exception as e:
                    print(f"Erro ao processar uma linha: {str(e)}")
                    continue

            print(
                f"Datas de atendimento encontradas para guia {guide_number}: {[d['date'] for d in guide_dates]}"
            )
            return guide_dates

        except Exception as e:
            print(f"Erro ao buscar guia: {str(e)}")
            self.driver.save_screenshot("erro_busca_completa.png")
            return []

    def get_execution_dates(self, data_atendimento: str):
        """Captura as datas de execução da tabela de Procedimentos em Série para um atendimento específico."""
        execution_dates = []

        try:
            print("Tentando localizar a tabela de 'Data de Procedimentos em Série'...")

            # Aumenta o tempo de espera temporariamente para esta operação
            original_wait = self.wait
            self.wait = WebDriverWait(self.driver, 30)  # Aumenta para 30 segundos

            # Aguarda um pouco mais para a página carregar completamente
            self.random_wait(2, 3)

            # Tenta localizar a tabela pela classe específica e título
            try:
                table = self.wait.until(
                    EC.presence_of_element_located(
                        (
                            By.XPATH,
                            "//table[contains(@class, 'MagnetoFormTABLE')]//td[contains(text(), 'Data de Procedimentos em Série')]/ancestor::table[1]",
                        )
                    )
                )
            except:
                print(
                    "Não foi possível encontrar a tabela pela classe, tentando método alternativo"
                )
                table = self.wait.until(
                    EC.presence_of_element_located(
                        (By.XPATH, '//*[@id="conteudo"]/table[6]')
                    )
                )

            print("Tabela localizada com sucesso.")

            # Encontra todas as células de dados (ignorando o cabeçalho e a linha de observação)
            try:
                data_cells = table.find_elements(By.CLASS_NAME, "MagnetoDataTD")
                print(f"Encontradas {len(data_cells)} células de dados")

                # Processa cada célula
                for cell in data_cells:
                    try:
                        text = cell.text.strip().replace(
                            "\xa0", " "
                        )  # Remove non-breaking spaces

                        # Ignora a célula de observação
                        if "Observação" in text:
                            continue

                        print(f"Processando célula com texto: '{text}'")

                        # Verifica se o texto contém " - " e extrai a parte após o hífen
                        if " - " in text:
                            parts = text.split(" - ", 1)
                            if len(parts) == 2:
                                date_part = parts[1].strip()
                                # Verifica se a parte extraída é uma data válida (dd/mm/yyyy)
                                if date_part and self._is_valid_date(date_part):
                                    execution_dates.append(date_part)
                                    print(f"Data válida encontrada: {date_part}")
                                else:
                                    if date_part:
                                        print(f"Data inválida encontrada: {date_part}")
                            else:
                                print(f"Formato inesperado na célula: '{text}'")
                        else:
                            print(f"Formato inesperado na célula: '{text}'")

                    except Exception as e:
                        print(f"Erro ao processar célula: {str(e)}")
                        continue

            except Exception as e:
                print(f"Erro ao processar a tabela: {str(e)}")
                self.driver.save_screenshot("erro_processamento_tabela.png")
                return execution_dates

            # Restaura o tempo de espera original
            self.wait = original_wait

            print(f"Datas de execução encontradas: {execution_dates}")
            self.driver.save_screenshot("datas_encontradas.png")
            return execution_dates

        except Exception as e:
            print(f"Erro ao capturar datas de execução: {str(e)}")
            self.driver.save_screenshot("erro_captura_datas_execucao.png")
            return []

    def _is_valid_date(self, date_str: str) -> bool:
        """Verifica se a string fornecida está no formato de data dd/mm/yyyy."""
        try:
            datetime.strptime(date_str, "%d/%m/%Y")
            return True
        except ValueError:
            return False

    def process_single_guide(self, guide_data: dict):
        """Processa uma única guia e extrai todos os dados necessários"""
        try:
            print(f"\nProcessando guia: {guide_data['guide_number']}")

            # Navega para a tela de exames finalizados
            if not self.navigate_to_finished_exams():
                raise Exception("Falha ao navegar para exames finalizados")

            # Busca e captura todas as datas de atendimento
            guide_dates = self.search_and_get_guide_dates(guide_data["guide_number"])
            if not guide_dates:
                print("Nenhuma data de atendimento encontrada")
                return []

            guide_details_list = []

            # Para cada data de atendimento, processa a guia
            for index, guide_date in enumerate(guide_dates, start=1):
                print(f"\nProcessando atendimento {index}: {guide_date['date']}")

                # Inicializa as variáveis antes do try
                carteira, nome = "", ""
                professional_name = professional_council = council_number = (
                    council_state
                ) = cbo_code = ""
                biometric_data = ""

                try:
                    # Localiza o link da guia usando XPath mais específico que inclui a data
                    guide_link = self.wait.until(
                        EC.element_to_be_clickable(
                            (
                                By.XPATH,
                                f"//tr[td[1][contains(text(), '{guide_date['date']}')]]//a[contains(text(), '{guide_date['guide_number_text']}')]",
                            )
                        )
                    )
                    guide_link.click()
                    self.random_wait(1, 2)  # Aumentado o tempo de espera
                    print("Guia aberta")

                    # Extrai dados da carteira e beneficiário
                    beneficiary_info = self.wait.until(
                        EC.presence_of_element_located(
                            (
                                By.XPATH,
                                "//*[@id='conteudo']/table[1]/tbody/tr[6]/td[1]/span",
                            )
                        )
                    ).text

                    # Separa carteira e nome do beneficiário
                    if " - " in beneficiary_info:
                        carteira, nome = beneficiary_info.split(" - ", 1)
                        carteira = carteira.strip()
                        nome = nome.strip()

                    # Extrai código do procedimento
                    procedure_code = self.wait.until(
                        EC.presence_of_element_located(
                            (By.XPATH, "//*[@id='conteudo']/table[4]/tbody/tr[2]/td[5]")
                        )
                    ).text
                    print("Código do procedimento capturado")

                    # Extrai dados do profissional
                    try:
                        professional_name = self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[4]",
                                )
                            )
                        ).text
                        professional_council = self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[5]",
                                )
                            )
                        ).text
                        council_number = self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[6]",
                                )
                            )
                        ).text
                        council_state = self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[7]",
                                )
                            )
                        ).text
                        cbo_code = self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[8]",
                                )
                            )
                        ).text
                        print("Dados do profissional capturados")
                    except Exception as e:
                        print(f"Erro ao capturar dados do profissional: {str(e)}")
                        # As variáveis já estão inicializadas como strings vazias

                    # Captura datas de execução, passando o data_atendimento correto
                    execution_dates = self.get_execution_dates(guide_date["date"])
                    if execution_dates:
                        for exec_date in execution_dates:
                            guide_details = {
                                "carteira": carteira,
                                "nome_beneficiario": nome,
                                "codigo_procedimento": procedure_code,
                                "data_atendimento": guide_date["date"],
                                "data_execucao": exec_date,
                                "numero_guia": guide_data["guide_number"],
                                "biometria": "",  # Biometria desabilitada
                                "nome_profissional": professional_name,
                                "conselho_profissional": professional_council,
                                "numero_conselho": council_number,
                                "uf_conselho": council_state,
                                "codigo_cbo": cbo_code,
                            }
                            guide_details_list.append(guide_details)
                    else:
                        # Se não encontrou datas de execução, salva com a data de atendimento
                        guide_details = {
                            "carteira": carteira,
                            "nome_beneficiario": nome,
                            "codigo_procedimento": procedure_code,
                            "data_atendimento": guide_date["date"],
                            "data_execucao": "",
                            "numero_guia": guide_data["guide_number"],
                            "biometria": "",  # Biometria desabilitada
                            "nome_profissional": professional_name,
                            "conselho_profissional": professional_council,
                            "numero_conselho": council_number,
                            "uf_conselho": council_state,
                            "codigo_cbo": cbo_code,
                        }
                        guide_details_list.append(guide_details)

                    # Clica no botão "Voltar" usando o XPath fornecido
                    back_button = self.wait.until(
                        EC.element_to_be_clickable((By.XPATH, '//*[@id="Btn_Voltar"]'))
                    )
                    back_button.click()
                    print("Botão 'Voltar' clicado")

                    # Aguarda a página de lista de guias carregar
                    try:
                        self.wait.until(
                            EC.presence_of_element_located(
                                (
                                    By.XPATH,
                                    '//*[@id="filtro"]/table/tbody/tr[3]/td[4]/input',
                                )  # Ajuste conforme necessário
                            )
                        )
                        print("Página de lista de guias carregada novamente.")
                    except TimeoutException:
                        print(
                            "Timeout: Página de lista de guias não carregou corretamente após clicar em 'Voltar'."
                        )
                        self.driver.save_screenshot("timeout_voltar.png")
                        continue  # Pula para o próximo atendimento

                    self.random_wait()

                except Exception as e:
                    print(
                        f"Erro ao processar atendimento {guide_date['date']}: {str(e)}"
                    )
                    self.driver.save_screenshot(
                        f"erro_atendimento_{guide_date['date']}.png"
                    )
                    continue  # Continua com a próxima data

            # Salva todos os dados em Excel
            if guide_details_list:
                df = pd.DataFrame(guide_details_list)
                excel_file = f"guia_{guide_data['guide_number']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                df.to_excel(excel_file, index=False)
                print(
                    f"Dados salvos em {excel_file} ({len(guide_details_list)} linhas)"
                )

            return guide_details_list

        except Exception as e:
            print(f"Erro ao processar guia {guide_data['guide_number']}: {str(e)}")
            self.driver.save_screenshot(f"erro_guia_{guide_data['guide_number']}.png")
            raise

    def close(self):
        """Fecha o navegador"""
        if self.driver:
            self.driver.quit()
            print("Navegador fechado")

    def save_captured_guides(self):
        """Salva as guias capturadas em um arquivo Excel"""
        try:
            df = pd.DataFrame(self.captured_guides)
            excel_file = (
                f"guias_capturadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            )
            df.to_excel(excel_file, index=False)
            print(f"Guias salvas no arquivo: {excel_file}")
        except Exception as e:
            print(f"Erro ao salvar arquivo Excel: {str(e)}")

    def capture_guides(self, start_date: str, end_date: str):
        """Captura todas as guias dentro do período especificado"""
        try:
            print(f"Iniciando captura de guias entre {start_date} e {end_date}")

            finished_exams = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, '//*[@id="centro_21"]/a'))
            )
            finished_exams.click()
            print("Acessou tela de exames finalizados")
            self.random_wait()

            start_date_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "s_dt_ini"))
            )
            end_date_field = self.wait.until(
                EC.presence_of_element_located((By.NAME, "s_dt_fim"))
            )

            start_date_field.clear()
            start_date_field.send_keys(start_date)

            end_date_field.clear()
            end_date_field.send_keys(end_date)
            print("Datas preenchidas")

            filter_button = self.wait.until(
                EC.element_to_be_clickable((By.NAME, "Button_FIltro"))
            )
            filter_button.click()
            print("Filtro aplicado")
            self.random_wait()

            self.driver.save_screenshot("busca_guias.png")

            page_num = 1
            while True:
                print(f"Processando página {page_num}")
                guides_table = self.wait.until(
                    EC.presence_of_element_located(
                        (By.XPATH, '//*[@id="conteudo"]/form[2]/table/tbody')
                    )
                )
                rows = guides_table.find_elements(By.TAG_NAME, "tr")[1:]

                for row in rows:
                    try:
                        date_time = row.find_element(By.XPATH, "./td[1]").text.strip()
                        # Remove a parte de horas e minutos da data
                        date = date_time.split()[0] if date_time else ""
                        guide_number = row.find_element(
                            By.XPATH, "./td[2]/a"
                        ).text.strip()

                        if date and guide_number:
                            self.captured_guides.append(
                                {"date": date, "guide_number": guide_number}
                            )
                            print(f"Guia capturada: {guide_number} - Data: {date}")

                    except NoSuchElementException:
                        continue
                    except Exception as e:
                        print(f"Erro ao processar linha: {str(e)}")
                        continue

                try:
                    next_button = self.driver.find_element(By.LINK_TEXT, "Próxima")
                    if "disabled" in next_button.get_attribute("class"):
                        print("Última página alcançada")
                        break
                    next_button.click()
                    print(f"Indo para página {page_num + 1}")
                    self.random_wait()
                    page_num += 1
                except NoSuchElementException:
                    print("Não há mais páginas")
                    break

            print(f"Total de guias capturadas: {len(self.captured_guides)}")
            self.save_captured_guides()
            return self.captured_guides

        except Exception as e:
            print(f"Erro durante a captura de guias: {str(e)}")
            self.driver.save_screenshot("erro_captura.png")
            raise


def test_unimed():
    """Teste da Fase 3 - Processamento de Múltiplas Guias"""
    print("\nIniciando teste da Fase 3 - Processamento de Múltiplas Guias")

    try:
        automation = UnimedAutomation()
        driver = automation.setup_driver()
        print("\nDriver configurado com sucesso")

        username = os.getenv("UNIMED_USERNAME")
        password = os.getenv("UNIMED_PASSWORD")

        if not username or not password:
            print("Erro: Credenciais não encontradas no arquivo .env")
            return

        if automation.login(username, password):
            print("\nLogin realizado com sucesso")

            # Primeiro captura todas as guias do período
            start_date = "20/01/2025"  # Ajuste conforme necessário
            end_date = "21/01/2025"  # Ajuste conforme necessário

            guides = automation.capture_guides(start_date, end_date)
            print(f"\nCapturadas {len(guides)} guias para processamento")

            # Processa cada guia capturada
            for guide in guides:
                try:
                    print(f"\nProcessando guia: {guide['guide_number']}")
                    automation.process_single_guide(guide)
                except Exception as e:
                    print(f"Erro ao processar guia {guide['guide_number']}: {str(e)}")
                    continue

        automation.close()
        print("\nNavegador fechado")

    except Exception as e:
        print(f"\nErro durante a execução: {str(e)}")
        if automation and automation.driver:
            automation.close()


if __name__ == "__main__":
    test_unimed()
