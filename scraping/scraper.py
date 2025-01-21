from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import pandas as pd
import random
import time
from datetime import datetime
from typing import List, Dict, Optional
import os
import logging


class UnimedScraper:
    def __init__(self, chrome_profile_path: str = None):
        self.chrome_profile_path = chrome_profile_path or os.path.join(
            os.environ["USERPROFILE"], "AppData/Local/Google/Chrome/User Data"
        )
        self.driver = None
        self.wait = None
        self.captured_guides = []
        self.protocol_data = []
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def setup_driver(self):
        """Configure and initialize Chrome WebDriver"""
        options = webdriver.ChromeOptions()
        options.add_argument(f"user-data-dir={self.chrome_profile_path}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-infobars")

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.maximize_window()

    def random_wait(self, min_seconds: float = 1, max_seconds: float = 3):
        """Add random wait time to simulate human behavior"""
        time.sleep(random.uniform(min_seconds, max_seconds))

    def login(self, username: str, password: str):
        """Login to Unimed system"""
        try:
            self.driver.get("https://sgucard.unimedgoiania.coop.br/cmagnet/Login.do")
            self.random_wait()

            # Login fields
            login_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "login"))
            )
            password_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "passwordTemp"))
            )

            # Clear and fill login fields
            login_field.clear()
            login_field.send_keys(username)
            self.random_wait(0.5, 1)

            password_field.clear()
            password_field.send_keys(password)
            self.random_wait(0.5, 1)

            # Click login button
            login_button = self.wait.until(
                EC.element_to_be_clickable((By.ID, "Button_DoLogin"))
            )
            login_button.click()
            self.random_wait()

            return True
        except Exception as e:
            self.logger.error(f"Login failed: {str(e)}")
            return False

    def capture_guides(self, start_date: str, end_date: str):
        """Capture all guides within the specified date range"""
        try:
            # Navigate to finished exams
            finished_exams = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, '//*[@id="centro_21"]/a'))
            )
            finished_exams.click()
            self.random_wait()

            # Set date range
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

            # Click filter button
            filter_button = self.wait.until(
                EC.element_to_be_clickable((By.NAME, "Button_FIltro"))
            )
            filter_button.click()
            self.random_wait()

            # Capture guides from all pages
            while True:
                guides_table = self.wait.until(
                    EC.presence_of_element_located(
                        (By.XPATH, '//*[@id="conteudo"]/form[2]/table/tbody')
                    )
                )
                rows = guides_table.find_elements(By.TAG_NAME, "tr")[
                    1:
                ]  # Skip header row

                for row in rows:
                    try:
                        date = row.find_element(By.XPATH, "./td[1]").text
                        guide_number = row.find_element(By.XPATH, "./td[2]/a").text

                        self.captured_guides.append(
                            {"date": date, "guide_number": guide_number}
                        )
                    except NoSuchElementException:
                        continue

                # Try to go to next page
                try:
                    next_button = self.driver.find_element(By.LINK_TEXT, "Próxima")
                    if "disabled" in next_button.get_attribute("class"):
                        break
                    next_button.click()
                    self.random_wait()
                except NoSuchElementException:
                    break

        except Exception as e:
            self.logger.error(f"Error capturing guides: {str(e)}")
            raise

    def process_guide(self, guide_data: Dict):
        """Process individual guide and extract detailed information"""
        try:
            # Search for the guide
            guide_search = self.wait.until(
                EC.presence_of_element_located((By.NAME, "s_nr_guia"))
            )
            guide_search.clear()
            guide_search.send_keys(guide_data["guide_number"])

            filter_button = self.wait.until(
                EC.element_to_be_clickable((By.NAME, "Button_FIltro"))
            )
            filter_button.click()
            self.random_wait()

            # Extract guide information
            card_number = self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="conteudo"]/table[1]/tbody/tr[6]/td[1]/span')
                )
            ).text

            # Get biometric information
            biometric_icon = self.wait.until(
                EC.element_to_be_clickable(
                    (
                        By.XPATH,
                        '//*[@id="conteudo"]/form[2]/table/tbody/tr[2]/td[7]/span[2]/a',
                    )
                )
            )
            biometric_icon.click()
            self.random_wait()

            # Switch to biometric window
            self.driver.switch_to.window(self.driver.window_handles[-1])

            # Extract biometric data
            biometric_data = self._extract_biometric_data(guide_data["date"])

            # Close biometric window and switch back
            self.driver.close()
            self.driver.switch_to.window(self.driver.window_handles[0])

            # Extract additional guide information
            guide_info = self._extract_guide_details()

            # Combine all information
            protocol_entry = {
                "guide_number": guide_data["guide_number"],
                "card_number": card_number,
                "biometric_data": biometric_data,
                **guide_info,
            }

            self.protocol_data.append(protocol_entry)

        except Exception as e:
            self.logger.error(f"Error processing guide {guide_data['guide_number']}: {str(e)}")
            raise

    def _extract_biometric_data(self, execution_date: str) -> str:
        """Extract biometric data from the biometric window"""
        try:
            table = self.wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, '//*[@id="conteudo-submenu"]/table[2]')
                )
            )
            rows = table.find_elements(By.TAG_NAME, "tr")

            for i in range(len(rows)):
                try:
                    date_elem = rows[i].find_element(By.XPATH, "./td[2]/span")
                    if date_elem.text == execution_date:
                        biometric_elem = rows[i + 1].find_element(By.XPATH, "./td/span")
                        return biometric_elem.text
                except NoSuchElementException:
                    continue

            return ""

        except Exception as e:
            self.logger.error(f"Error extracting biometric data: {str(e)}")
            return ""

    def _extract_guide_details(self) -> Dict:
        """Extract detailed information from the guide"""
        xpath_mappings = {
            "professional_name": '//*[@id="conteudo"]/table[5]/tbody/tr[3]/td[4]',
            "council_name": '//*[@id="conteudo"]/table[5]/tbody/tr[3]/td[5]',
            "council_number": '//*[@id="conteudo"]/table[5]/tbody/tr[3]/td[6]',
            "council_state": '//*[@id="conteudo"]/table[5]/tbody/tr[3]/td[7]',
            "cbo_code": '//*[@id="conteudo"]/table[5]/tbody/tr[3]/td[8]',
            "therapy_code": '//*[@id="conteudo"]/table[2]/tbody/tr[2]/td[2]',
        }

        details = {}
        for key, xpath in xpath_mappings.items():
            try:
                element = self.wait.until(
                    EC.presence_of_element_located((By.XPATH, xpath))
                )
                details[key] = element.text.strip()
            except:
                details[key] = ""

        return details

    def save_to_excel(self, filename: str):
        """Save captured data to Excel file"""
        df = pd.DataFrame(self.protocol_data)
        df.to_excel(filename, index=False)

    def close(self):
        """Close the browser and clean up"""
        if self.driver:
            self.driver.quit()
