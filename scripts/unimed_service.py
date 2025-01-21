from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
import time
import random
import logging
import asyncio
from typing import List, Dict, Optional, Union
import database_supabase as db

class UnimedService:
    def __init__(self):
        self.driver = None
        self.wait = None
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for the service"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('UnimedService')

    async def setup_driver(self):
        """Configure and initialize Chrome in headless mode"""
        try:
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
            self.wait = WebDriverWait(self.driver, 20)
            self.logger.info("WebDriver setup completed successfully")
            return True
        except Exception as e:
            self.logger.error(f"Error setting up WebDriver: {str(e)}")
            return False

    def _random_wait(self, min_seconds: float = 0.5, max_seconds: float = 1):
        """Add random delay between actions"""
        time.sleep(random.uniform(min_seconds, max_seconds))

    async def login(self, username: str, password: str) -> bool:
        """Perform login to the system"""
        try:
            self.logger.info("Starting login process")
            self.driver.get("https://sgucard.unimedgoiania.coop.br/cmagnet/Login.do")

            login_field = self.wait.until(EC.presence_of_element_located((By.ID, "login")))
            login_field.clear()
            login_field.send_keys(username)

            password_field = self.wait.until(EC.presence_of_element_located((By.ID, "passwordTemp")))
            password_field.clear()
            password_field.send_keys(password)

            login_button = self.wait.until(EC.element_to_be_clickable((By.ID, "Button_DoLogin")))
            login_button.click()

            self._random_wait(2, 3)
            self.logger.info("Login successful")
            return True

        except Exception as e:
            self.logger.error(f"Login error: {str(e)}")
            return False

    async def navigate_to_finished_exams(self) -> bool:
        """Navigate to finished exams screen"""
        try:
            finished_exams = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "td#centro_21 a"))
            )
            finished_exams.click()
            self._random_wait()
            self.logger.info("Successfully navigated to finished exams")
            return True

        except Exception as e:
            self.logger.error(f"Error navigating to finished exams: {str(e)}")
            return False

    async def search_guide(self, guide_number: str) -> bool:
        """Search for a specific guide using the search form"""
        try:
            guide_input = self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="filtro"]/table/tbody/tr[3]/td[4]/input')
                )
            )
            guide_input.clear()
            self._random_wait(0.5, 1)
            guide_input.send_keys(guide_number)

            filter_button = self.wait.until(
                EC.element_to_be_clickable(
                    (By.XPATH, '//*[@id="filtro"]/table/tbody/tr[7]/td/input[3]')
                )
            )
            filter_button.click()
            self._random_wait()
            return True

        except Exception as e:
            self.logger.error(f"Error searching guide: {str(e)}")
            return False

    async def get_execution_dates(self, data_atendimento: str) -> List[str]:
        """Capture execution dates from the Series Procedures table"""
        try:
            original_wait = self.wait
            self.wait = WebDriverWait(self.driver, 30)
            self._random_wait(2, 3)

            table = await self._find_dates_table()
            execution_dates = []

            if table:
                data_cells = table.find_elements(By.CLASS_NAME, "MagnetoDataTD")
                for cell in data_cells:
                    date = self._extract_date_from_cell(cell)
                    if date:
                        execution_dates.append(date)

            self.wait = original_wait
            self.logger.info(f"Found {len(execution_dates)} execution dates")
            return execution_dates

        except Exception as e:
            self.logger.error(f"Error capturing execution dates: {str(e)}")
            return []

    async def _find_dates_table(self):
        """Helper method to find the dates table"""
        try:
            return self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, "//table[contains(@class, 'MagnetoFormTABLE')]//td[contains(text(), 'Data de Procedimentos em Série')]/ancestor::table[1]")
                )
            )
        except:
            return self.wait.until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="conteudo"]/table[6]'))
            )

    def _extract_date_from_cell(self, cell) -> Optional[str]:
        """Helper method to extract date from a cell"""
        try:
            text = cell.text.strip().replace("\xa0", " ")
            if "Observação" in text:
                return None

            if " - " in text:
                parts = text.split(" - ", 1)
                if len(parts) == 2:
                    date_part = parts[1].strip()
                    if date_part and self._is_valid_date(date_part):
                        return date_part
            return None
        except Exception as e:
            self.logger.error(f"Error extracting date from cell: {str(e)}")
            return None

    def _is_valid_date(self, date_str: str) -> bool:
        """Validate if the string is in dd/mm/yyyy format"""
        try:
            datetime.strptime(date_str, "%d/%m/%Y")
            return True
        except ValueError:
            return False

    async def process_guide(self, guide_data: Dict) -> bool:
        """Process a guide and store its data in the database"""
        try:
            self.logger.info(f"Processing guide: {guide_data['numero_guia']}")

            if not await self.navigate_to_finished_exams():
                raise Exception("Failed to navigate to finished exams")

            if not await self.search_guide(guide_data['numero_guia']):
                raise Exception("Failed to search guide")

            guide_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, f"//a[contains(text(), '{guide_data['numero_guia']}')]"))
            )
            guide_link.click()
            self._random_wait(1, 2)

            # Extract guide data
            guide_info = await self._extract_guide_info()
            
            # Get execution dates
            execution_dates = await self.get_execution_dates(guide_info['data_atendimento'])

            # Store in database
            guide_info['execution_dates'] = execution_dates
            await self._store_guide_data(guide_info)

            self.logger.info(f"Successfully processed guide {guide_data['numero_guia']}")
            return True

        except Exception as e:
            self.logger.error(f"Error processing guide {guide_data['numero_guia']}: {str(e)}")
            return False

    async def _extract_guide_info(self) -> Dict:
        """Extract information from the guide details page"""
        try:
            beneficiary_info = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[1]/tbody/tr[6]/td[1]/span"))
            ).text

            carteira, nome = beneficiary_info.split(" - ", 1) if " - " in beneficiary_info else ("", "")

            procedure_code = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[4]/tbody/tr[2]/td[5]"))
            ).text

            professional_info = await self._extract_professional_info()

            return {
                "carteira": carteira.strip(),
                "nome_beneficiario": nome.strip(),
                "codigo_procedimento": procedure_code,
                **professional_info
            }

        except Exception as e:
            self.logger.error(f"Error extracting guide info: {str(e)}")
            raise

    async def _extract_professional_info(self) -> Dict:
        """Extract professional information from the guide details page"""
        try:
            return {
                "nome_profissional": self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[4]"))
                ).text,
                "conselho_profissional": self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[5]"))
                ).text,
                "numero_conselho": self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[6]"))
                ).text,
                "uf_conselho": self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[7]"))
                ).text,
                "codigo_cbo": self.wait.until(
                    EC.presence_of_element_located((By.XPATH, "//*[@id='conteudo']/table[5]/tbody/tr[3]/td[8]"))
                ).text
            }
        except Exception as e:
            self.logger.error(f"Error extracting professional info: {str(e)}")
            return {
                "nome_profissional": "",
                "conselho_profissional": "",
                "numero_conselho": "",
                "uf_conselho": "",
                "codigo_cbo": ""
            }

    async def _store_guide_data(self, guide_info: Dict) -> bool:
        """Store the guide data in the database"""
        try:
            # Create guide record
            guide_data = {
                "numero_guia": guide_info["numero_guia"],
                "paciente_nome": guide_info["nome_beneficiario"],
                "paciente_carteirinha": guide_info["carteira"],
                "data_emissao": datetime.now().strftime("%Y-%m-%d"),
                "status": "pendente",
                "quantidade_autorizada": len(guide_info["execution_dates"]),
                "quantidade_executada": 0,
                "tipo": "sp_sadt",
                "procedimento_codigo": guide_info["codigo_procedimento"],
                "profissional_executante": guide_info["nome_profissional"]
            }

            if not await db.salvar_guia(guide_data):
                raise Exception("Failed to save guide data")

            # Create executions for each date
            for date in guide_info["execution_dates"]:
                execution_data = {
                    "numero_guia": guide_info["numero_guia"],
                    "paciente_nome": guide_info["nome_beneficiario"],
                    "data_execucao": date,
                    "paciente_carteirinha": guide_info["carteira"]
                }
                if not await db.salvar_execucao(execution_data):
                    self.logger.warning(f"Failed to save execution for date {date}")

            return True

        except Exception as e:
            self.logger.error(f"Error storing guide data: {str(e)}")
            return False

    async def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Browser closed")