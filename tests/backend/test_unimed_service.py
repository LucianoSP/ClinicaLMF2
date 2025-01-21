import pytest
from unittest.mock import Mock, patch, AsyncMock
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from scripts.unimed_service import UnimedService

@pytest.fixture
async def unimed_service():
    service = UnimedService()
    service.driver = Mock()
    service.wait = Mock()
    yield service
    await service.close()

class TestUnimedService:
    @pytest.mark.asyncio
    async def test_setup_driver_success(self):
        with patch('scripts.unimed_service.webdriver.Chrome') as mock_chrome:
            service = UnimedService()
            mock_chrome.return_value = Mock()
            result = await service.setup_driver()
            assert result is True
            assert service.driver is not None
            assert service.wait is not None

    @pytest.mark.asyncio
    async def test_setup_driver_failure(self):
        with patch('scripts.unimed_service.webdriver.Chrome', side_effect=Exception("Driver error")):
            service = UnimedService()
            result = await service.setup_driver()
            assert result is False
            assert service.driver is None

    @pytest.mark.asyncio
    async def test_login_success(self, unimed_service):
        # Mock the WebDriver wait and element interactions
        mock_login = Mock()
        mock_password = Mock()
        mock_button = Mock()
        
        unimed_service.wait.until.side_effect = [mock_login, mock_password, mock_button]
        
        result = await unimed_service.login("test_user", "test_pass")
        
        assert result is True
        unimed_service.driver.get.assert_called_once_with("https://sgucard.unimedgoiania.coop.br/cmagnet/Login.do")
        mock_login.send_keys.assert_called_once_with("test_user")
        mock_password.send_keys.assert_called_once_with("test_pass")
        mock_button.click.assert_called_once()

    @pytest.mark.asyncio
    async def test_login_failure(self, unimed_service):
        unimed_service.wait.until.side_effect = TimeoutException()
        
        result = await unimed_service.login("test_user", "test_pass")
        
        assert result is False

    @pytest.mark.asyncio
    async def test_navigate_to_finished_exams_success(self, unimed_service):
        mock_element = Mock()
        unimed_service.wait.until.return_value = mock_element
        
        result = await unimed_service.navigate_to_finished_exams()
        
        assert result is True
        mock_element.click.assert_called_once()

    @pytest.mark.asyncio
    async def test_navigate_to_finished_exams_failure(self, unimed_service):
        unimed_service.wait.until.side_effect = TimeoutException()
        
        result = await unimed_service.navigate_to_finished_exams()
        
        assert result is False

    @pytest.mark.asyncio
    async def test_search_guide_success(self, unimed_service):
        mock_input = Mock()
        mock_button = Mock()
        unimed_service.wait.until.side_effect = [mock_input, mock_button]
        
        result = await unimed_service.search_guide("123456")
        
        assert result is True
        mock_input.send_keys.assert_called_once_with("123456")
        mock_button.click.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_execution_dates_success(self, unimed_service):
        mock_table = Mock()
        mock_cell1 = Mock()
        mock_cell1.text = "1 - 01/01/2024"
        mock_cell2 = Mock()
        mock_cell2.text = "2 - 02/01/2024"
        
        mock_table.find_elements.return_value = [mock_cell1, mock_cell2]
        
        with patch.object(unimed_service, '_find_dates_table', new_callable=AsyncMock) as mock_find_table:
            mock_find_table.return_value = mock_table
            dates = await unimed_service.get_execution_dates("01/01/2024")
            
            assert len(dates) == 2
            assert "01/01/2024" in dates
            assert "02/01/2024" in dates

    @pytest.mark.asyncio
    async def test_process_guide_success(self, unimed_service):
        guide_data = {"numero_guia": "123456"}
        
        with patch.object(unimed_service, 'navigate_to_finished_exams', new_callable=AsyncMock) as mock_navigate, \
             patch.object(unimed_service, 'search_guide', new_callable=AsyncMock) as mock_search, \
             patch.object(unimed_service, '_extract_guide_info', new_callable=AsyncMock) as mock_extract, \
             patch.object(unimed_service, 'get_execution_dates', new_callable=AsyncMock) as mock_dates, \
             patch.object(unimed_service, '_store_guide_data', new_callable=AsyncMock) as mock_store:
            
            mock_navigate.return_value = True
            mock_search.return_value = True
            mock_extract.return_value = {"data_atendimento": "01/01/2024"}
            mock_dates.return_value = ["01/01/2024", "02/01/2024"]
            mock_store.return_value = True
            
            mock_element = Mock()
            unimed_service.wait.until.return_value = mock_element
            
            result = await unimed_service.process_guide(guide_data)
            
            assert result is True
            mock_navigate.assert_called_once()
            mock_search.assert_called_once_with("123456")
            mock_extract.assert_called_once()
            mock_dates.assert_called_once()
            mock_store.assert_called_once()

    @pytest.mark.asyncio
    async def test_process_guide_failure_navigation(self, unimed_service):
        guide_data = {"numero_guia": "123456"}
        
        with patch.object(unimed_service, 'navigate_to_finished_exams', new_callable=AsyncMock) as mock_navigate:
            mock_navigate.return_value = False
            
            result = await unimed_service.process_guide(guide_data)
            
            assert result is False

    @pytest.mark.asyncio
    async def test_close(self, unimed_service):
        await unimed_service.close()
        unimed_service.driver.quit.assert_called_once()