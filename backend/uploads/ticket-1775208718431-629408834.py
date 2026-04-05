#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Jira Downloader - Парсер для скачивания всех данных из Jira с авторизацией

Возможности:
- Авторизация через login.jsp с получением сессионных кук
- Скачивание задач (issues) с использованием JQL
- Скачивание тест-кейсов из Zephyr
- Скачивание проектов
- Скачивание пользователей
- Сохранение данных в JSON/CSV файлы
"""

import requests
import json
import csv
import os
import logging
import time
import glob
from datetime import datetime
from typing import List, Dict, Optional, Any
from urllib3.exceptions import InsecureRequestWarning
from dotenv import load_dotenv
from typing import List, Dict, Optional, Any
from urllib3.exceptions import InsecureRequestWarning
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Отключаем предупреждения SSL
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)


class JiraDownloader:
    """Класс для скачивания данных из Jira"""
    
    def __init__(self, config: Optional[Dict[str, str]] = None):
        """
        Инициализация загрузчика
        
        Args:
            config: Словарь с конфигурацией. Если None - загружается из .env
        """
        self.setup_logging()
        self.load_config(config)
        self.session = None
        self.headers = None
        self.user_cache = {}
        
    def setup_logging(self):
        """Настройка логирования"""
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        log_file = os.getenv('LOG_FILE', 'jira_downloader.log')
        
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(log_file, encoding='utf-8')
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_config(self, config: Optional[Dict[str, str]] = None):
        """Загрузка конфигурации"""
        if config:
            # Используем переданную конфигурацию
            self.base_url = config.get('JIRA_BASE_URL', '')
            self.username = config.get('JIRA_USERNAME', '')
            self.password = config.get('JIRA_PASSWORD', '')
            self.project_key = config.get('JIRA_PROJECT_KEY', '')
            self.project_id = config.get('JIRA_PROJECT_ID', '')
            self.output_dir = config.get('OUTPUT_DIR', 'jira_export')
        else:
            # Загружаем из .env
            self.base_url = os.getenv('JIRA_BASE_URL', 'http://jira.cn-innov.ru')
            self.username = os.getenv('JIRA_USERNAME', 'd.perlin')
            self.password = os.getenv('JIRA_PASSWORD', 'Cninnov2022')
            self.project_key = os.getenv('JIRA_PROJECT_KEY', '')
            self.project_id = os.getenv('JIRA_PROJECT_ID', '10100')
            self.output_dir = os.getenv('OUTPUT_DIR', 'jira_export')
        
        # Создаем директорию для вывода, если не существует
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.logger.info(f"Конфигурация загружена. URL: {self.base_url}")
        self.logger.info(f"Выходная директория: {self.output_dir}")
    
    def authenticate(self) -> bool:
        """
        Авторизация в Jira через login.jsp
        
        Returns:
            True если авторизация успешна, иначе False
        """
        try:
            self.logger.info("Начинаем авторизацию в Jira...")
            self.logger.info(f"URL: {self.base_url}")
            self.logger.info(f"Username: {self.username}")

            # Создаем сессию
            self.session = requests.Session()
            self.session.verify = False

            # Заголовки для имитации браузера
            self.headers = {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ru,en;q=0.9,uk;q=0.8',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'X-Atlassian-Token': 'no-check',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
            
            headers = self.headers.copy()
            headers.update({
                'Origin': self.base_url,
                'Referer': f'{self.base_url}/login.jsp',
            })

            # Получаем страницу логина для получения начальных кук
            login_page_response = self.session.get(
                f"{self.base_url}/login.jsp",
                headers={'User-Agent': headers['User-Agent']},
                verify=False
            )

            if login_page_response.status_code != 200:
                self.logger.error(f"Ошибка получения страницы логина: {login_page_response.status_code}")
                return False

            self.logger.info("Страница логина получена")

            # Данные для авторизации
            auth_data = {
                "username": self.username,
                "password": self.password,
                "rememberMe": False,
                "targetUrl": "",
                "captchaId": ""
            }

            # URL для авторизации (используем стандартный endpoint)
            auth_url = f"{self.base_url}/rest/tsv/1.0/authenticate?os_authType=none"

            # Выполняем авторизацию
            response = self.session.post(
                auth_url,
                headers=headers,
                json=auth_data
            )

            if response.status_code == 200:
                self.logger.info("Авторизация успешна!")

                # Проверяем наличие необходимых кук
                cookies = self.session.cookies
                required_cookies = ['JSESSIONID', 'atlassian.xsrf.token']
                received_cookies = [c for c in required_cookies if c in cookies]
                
                if received_cookies:
                    self.logger.info(f"✅ Получены куки: {received_cookies}")
                else:
                    self.logger.warning("⚠️ Куки JSESSIONID или atlassian.xsrf.token не получены")
                    
                return True
            else:
                self.logger.error(f"❌ Ошибка авторизации: {response.status_code}")
                self.logger.error(f"Ответ: {response.text[:500]}")
                return False

        except Exception as e:
            self.logger.error(f"Исключение при авторизации: {str(e)}")
            return False
    
    def authenticate_with_api_token(self, api_token: str) -> bool:
        """
        Альтернативная авторизация через API токен (для Atlassian Cloud)
        
        Args:
            api_token: API токен пользователя
            
        Returns:
            True если авторизация успешна, иначе False
        """
        try:
            self.logger.info("Авторизация через API токен...")
            
            self.session = requests.Session()
            self.session.verify = False
            
            # Базовая авторизация
            from requests.auth import HTTPBasicAuth
            auth = HTTPBasicAuth(self.username, api_token)
            
            self.headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
            
            # Проверяем подключение
            response = self.session.get(
                f"{self.base_url}/rest/api/2/myself",
                auth=auth,
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.logger.info("✅ Авторизация через API токен успешна!")
                user_data = response.json()
                self.logger.info(f"Авторизован как: {user_data.get('displayName')}")
                self.session.auth = auth
                return True
            else:
                self.logger.error(f"❌ Ошибка авторизации: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"Исключение при авторизации: {str(e)}")
            return False
    
    def get_user_display_name(self, username: str) -> str:
        """Получение ФИО пользователя по username с кэшированием"""
        if not username or username in self.user_cache:
            return self.user_cache.get(username, username or '')

        try:
            user_url = f"{self.base_url}/rest/api/2/user?username={username}"
            response = self.session.get(user_url, headers=self.headers, verify=False)

            if response.status_code == 200:
                user_data = response.json()
                display_name = user_data.get('displayName', username)
                self.user_cache[username] = display_name
                return display_name
            else:
                self.user_cache[username] = username
                return username
        except Exception as e:
            self.logger.warning(f"Ошибка получения пользователя {username}: {str(e)}")
            self.user_cache[username] = username
            return username
    
    # ==================== Методы для скачивания данных =====================
    
    def download_issue_types(self) -> List[Dict]:
        """
        Скачивание всех типов задач (Issue Types)
        
        Returns:
            Список типов задач
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание типов задач...")
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/issuetype",
                headers=self.headers
            )
            
            if response.status_code == 200:
                issue_types = response.json()
                self.logger.info(f"Загружено {len(issue_types)} типов задач")
                return issue_types
            else:
                self.logger.error(f"Ошибка получения типов задач: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания типов задач: {str(e)}")
            return []
    
    def download_issues_by_type(self, issue_type: str, max_results: int = 100) -> List[Dict]:
        """
        Скачивание задач определенного типа
        
        Args:
            issue_type: Название типа задачи (например, "Bug", "Task", "Story")
            max_results: Максимальное количество результатов за один запрос
            
        Returns:
            Список задач указанного типа
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []

            jql = f'type="{issue_type}" AND project = {self.project_key} ORDER BY created DESC'
            self.logger.info(f"Скачивание задач типа: {issue_type}")
            
            all_issues = []
            start_at = 0
            total = None
            
            while True:
                params = {
                    'jql': jql,
                    'startAt': start_at,
                    'maxResults': max_results,
                    'fields': '*all'
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/search",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    self.logger.error(f"Ошибка получения задач типа {issue_type}: {response.status_code}")
                    break
                
                data = response.json()
                
                if total is None:
                    total = data.get('total', 0)
                    self.logger.info(f"Всего задач типа {issue_type}: {total}")
                
                issues = data.get('issues', [])
                all_issues.extend(issues)
                
                self.logger.info(f"Получено: {len(all_issues)} из {total}")
                
                if len(issues) < max_results or len(all_issues) >= total:
                    break
                
                start_at += max_results
                time.sleep(0.5)
            
            self.logger.info(f"Загружено {len(all_issues)} задач типа {issue_type}")
            return all_issues
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания задач типа {issue_type}: {str(e)}")
            return []

    def download_all_issue_types(self) -> Dict[str, List[Dict]]:
        """
        Скачивание всех задач по всем типам
        
        Returns:
            Словарь с ключами = типами задач, значения = список задач
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return {}
            
            self.logger.info("Скачивание всех типов задач...")
            
            # Получаем все типы задач
            issue_types = self.download_issue_types()
            
            if not issue_types:
                self.logger.warning("Не удалось получить типы задач")
                return {}
            
            results = {}
            
            for issue_type in issue_types:
                type_name = issue_type.get('name', '')
                if not type_name:
                    continue
                    
                self.logger.info(f"Обрабатываем тип: {type_name}")
                issues = self.download_issues_by_type(type_name)
                
                if issues:
                    results[type_name] = issues
                    self.logger.info(f"Скачано {len(issues)} задач типа {type_name}")
                
                time.sleep(0.5)  # Задержка между типами
            
            total = sum(len(v) for v in results.values())
            self.logger.info(f"Всего скачано {total} задач из {len(results)} типов")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания всех типов задач: {str(e)}")
            return {}
    
    def download_issues(self, jql: str = None, max_results: int = 100, resume: bool = True) -> List[Dict]:
        """
        Скачивание задач (issues) с использованием JQL
        
        Args:
            jql: JQL запрос. Если None - используется запрос для проекта.
            max_results: Максимальное количество результатов за один запрос
            resume: Продолжить с места остановки (если есть сохраненные данные)
            
        Returns:
            Список задач
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []

            # Формируем JQL запрос
            if not jql:
                if self.project_key:
                    jql = f"project = {self.project_key} ORDER BY created DESC"
                else:
                    jql = "ORDER BY created DESC"
            
            self.logger.info(f"Скачивание задач с JQL: {jql}")
            
            # Проверяем прогресс
            start_at = 0
            if resume:
                progress = self.load_progress('issues')
                if progress and progress.get('data_type') == 'issues':
                    start_at = progress.get('start_at', 0)
                    self.logger.info(f"Продолжаем с позиции: {start_at}")
            
            all_issues = []
            total = None
            
            while True:
                params = {
                    'jql': jql,
                    'startAt': start_at,
                    'maxResults': max_results,
                    'fields': '*all'  # Получаем все поля
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/search",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    self.logger.error(f"Ошибка получения задач: {response.status_code}")
                    break
                
                data = response.json()
                
                if total is None:
                    total = data.get('total', 0)
                    self.logger.info(f"Всего задач: {total}")
                
                issues = data.get('issues', [])
                all_issues.extend(issues)
                
                self.logger.info(f"Получено: {len(all_issues)} из {total}")
                
                # Сохраняем промежуточный прогресс каждые 1000 записей
                if len(all_issues) % 1000 == 0 and len(all_issues) > 0:
                    self.save_progress('issues', issues, start_at, total)
                
                if len(issues) < max_results or len(all_issues) >= total:
                    break
                
                start_at += max_results
                time.sleep(0.5)  # Задержка между запросами
            
            self.logger.info(f"Загружено {len(all_issues)} задач")
            return all_issues
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания задач: {str(e)}")
            return []
    
    def download_test_cases(self, project_id: str = None) -> List[Dict]:
        """
        Скачивание тест-кейсов из Zephyr
        
        Args:
            project_id: ID проекта. Если None - используется из конфигурации.
            
        Returns:
            Список тест-кейсов
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []

            project_id = project_id or self.project_id
            self.logger.info(f"Скачивание тест-кейсов для проекта {project_id}")
            
            api_url = f"{self.base_url}/rest/tests/1.0/testcase/search"
            
            all_test_cases = []
            start_at = 0
            max_results = 40
            
            headers = self.headers.copy()
            headers['Referer'] = f'{self.base_url}/secure/Tests.jspa'
            headers['jira-project-id'] = project_id
            
            # Добавляем XSRF токен если есть
            if 'atlassian.xsrf.token' in self.session.cookies:
                headers['X-Atlassian-Token'] = self.session.cookies['atlassian.xsrf.token']
            
            while True:
                params = {
                    'query': f'testCase.projectId IN ({project_id}) ORDER BY testCase.keyNumber DESC',
                    'maxResults': max_results,
                    'startAt': start_at,
                    'archived': 'false',
                    'fields': 'id,key,projectId,name,averageTime,estimatedTime,labels,folderId,componentId,status,priority,lastTestResultStatus,majorVersion,createdOn,createdBy,updatedOn,updatedBy,customFieldValues,owner'
                }
                
                response = self.session.get(api_url, params=params, headers=headers)
                
                if response.status_code != 200:
                    self.logger.warning(f"Ошибка получения тест-кейсов: {response.status_code}")
                    break
                
                data = response.json()
                
                test_cases = data.get('testCases', [])
                all_test_cases.extend(test_cases)
                
                total = data.get('total', len(test_cases))
                self.logger.info(f"Получено: {len(all_test_cases)} из {total}")
                
                if len(test_cases) < max_results or len(all_test_cases) >= total:
                    break
                
                start_at += max_results
                time.sleep(0.5)
            
            self.logger.info(f"Загружено {len(all_test_cases)} тест-кейсов")
            return all_test_cases
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания тест-кейсов: {str(e)}")
            return []
    
    def download_projects(self) -> List[Dict]:
        """
        Скачивание списка проектов
        
        Returns:
            Список проектов
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание списка проектов...")
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/project",
                headers=self.headers
            )
            
            if response.status_code == 200:
                projects = response.json()
                self.logger.info(f"Загружено {len(projects)} проектов")
                return projects
            else:
                self.logger.error(f"Ошибка получения проектов: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания проектов: {str(e)}")
            return []
    
    def download_users(self, project_key: str = None) -> List[Dict]:
        """
        Скачивание пользователей проекта
        
        Args:
            project_key: Ключ проекта. Если None - скачиваются все пользователи.
            
        Returns:
            Список пользователей
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание пользователей...")
            
            # Получаем пользователей через поиск
            users = []
            max_results = 50
            start_at = 0
            
            while True:
                params = {
                    'username': '.',
                    'startAt': start_at,
                    'maxResults': max_results,
                    'includeActive': 'true',
                    'includeInactive': 'false'
                }
                
                if project_key:
                    params['project'] = project_key
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/user/search",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    break
                
                batch = response.json()
                if not batch:
                    break
                    
                users.extend(batch)
                
                if len(batch) < max_results:
                    break
                    
                start_at += max_results
                time.sleep(0.3)
            
            self.logger.info(f"Загружено {len(users)} пользователей")
            return users
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания пользователей: {str(e)}")
            return []
    
    def download_boards(self, project_key: str = None) -> List[Dict]:
        """
        Скачивание досок (Boards)
        
        Args:
            project_key: Ключ проекта для фильтрации
            
        Returns:
            Список досок
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание досок...")
            
            all_boards = []
            
            # Пробуем получить доски Scrum и Kanban
            board_types = ['scrum', 'kanban']
            
            for board_type in board_types:
                try:
                    params = {'type': board_type}
                    if project_key:
                        params['projectKeyOrId'] = project_key
                    
                    response = self.session.get(
                        f"{self.base_url}/rest/agile/1.0/board",
                        params=params,
                        headers=self.headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        boards = data.get('values', [])
                        all_boards.extend(boards)
                        self.logger.info(f"Загружено {len(boards)} досок типа {board_type}")
                except Exception as e:
                    self.logger.warning(f"Не удалось получить доски типа {board_type}: {e}")
            
            return all_boards
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания досок: {str(e)}")
            return []
    
    def download_sprints(self, board_id: int) -> List[Dict]:
        """
        Скачивание спринтов для доски
        
        Args:
            board_id: ID доски
            
        Returns:
            Список спринтов
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info(f"Скачивание спринтов для доски {board_id}...")
            
            all_sprints = []
            start_at = 0
            max_results = 50
            
            while True:
                params = {
                    'startAt': start_at,
                    'maxResults': max_results
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/agile/1.0/board/{board_id}/sprint",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                sprints = data.get('values', [])
                all_sprints.extend(sprints)
                
                if len(sprints) < max_results:
                    break
                
                start_at += max_results
                time.sleep(0.3)
            
            self.logger.info(f"Загружено {len(all_sprints)} спринтов")
            return all_sprints
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания спринтов: {str(e)}")
            return []
    
    def download_issue_comments(self, issue_key: str) -> List[Dict]:
        """
        Скачивание комментариев к задаче
        
        Args:
            issue_key: Ключ задачи
            
        Returns:
            Список комментариев
        """
        try:
            if not self.session:
                return []
            
            self.logger.info(f"Скачивание комментариев для {issue_key}...")
            
            all_comments = []
            start_at = 0
            max_results = 50
            
            while True:
                params = {
                    'startAt': start_at,
                    'maxResults': max_results
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/issue/{issue_key}/comment",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                comments = data.get('comments', [])
                all_comments.extend(comments)
                
                if len(comments) < max_results:
                    break
                
                start_at += max_results
            
            return all_comments
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания комментариев: {str(e)}")
            return []
    
    def download_issue_links(self, issue_key: str) -> List[Dict]:
        """
        Скачивание связей задачи
        
        Args:
            issue_key: Ключ задачи
            
        Returns:
            Список связей
        """
        try:
            if not self.session:
                return []
            
            self.logger.info(f"Скачивание связей для {issue_key}...")
            
            # Получаем данные задачи с полем "issuelinks"
            params = {
                'fields': 'issuelinks',
                'expand': 'names'
            }
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/issue/{issue_key}",
                params=params,
                headers=self.headers
            )
            
            if response.status_code != 200:
                self.logger.warning(f"Не удалось получить связи для {issue_key}")
                return []
            
            data = response.json()
            fields = data.get('fields', {})
            issue_links = fields.get('issuelinks', [])
            
            # Форматируем связи
            formatted_links = []
            for link in issue_links:
                link_type = link.get('type', {})
                inward = link_type.get('inward', '')
                outward = link_type.get('outward', '')
                
                # Определяем направление связи
                if 'outwardIssue' in link:
                    target = link.get('outwardIssue', {})
                    direction = 'outward'
                    relation = inward  # "blocks", "relates to" и т.д.
                elif 'inwardIssue' in link:
                    target = link.get('inwardIssue', {})
                    direction = 'inward'
                    relation = outward  # "is blocked by", "is related to" и т.д.
                else:
                    continue
                
                formatted_links.append({
                    'link_id': link.get('id', ''),
                    'issue_key': issue_key,
                    'target_key': target.get('key', ''),
                    'target_summary': target.get('fields', {}).get('summary', '') if target else '',
                    'relation': relation,
                    'direction': direction,
                    'link_type_id': link_type.get('id', '')
                })
            
            return formatted_links
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания связей: {str(e)}")
            return []
    
    def download_all_issue_links(self, issues: List[Dict] = None) -> List[Dict]:
        """
        Скачивание связей для всех задач
        
        Args:
            issues: Список задач. Если None - загружаются автоматически.
            
        Returns:
            Список всех связей
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание всех связей задач...")
            
            # Если задачи не переданы, загружаем их
            if issues is None:
                issues = self.download_issues()
            
            all_links = []
            
            for i, issue in enumerate(issues):
                issue_key = issue.get('key')
                if not issue_key:
                    continue
                
                if i % 10 == 0:
                    self.logger.info(f"Обработка связей: {i}/{len(issues)}")
                
                links = self.download_issue_links(issue_key)
                all_links.extend(links)
                
                time.sleep(0.3)  # Задержка между запросами
            
            self.logger.info(f"Загружено {len(all_links)} связей")
            return all_links
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания всех связей: {str(e)}")
            return []
    
    def download_link_types(self) -> List[Dict]:
        """
        Скачивание типов связей
        
        Returns:
            Список типов связей
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание типов связей...")
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/issueLinkType",
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                link_types = data.get('issueLinkTypes', [])
                self.logger.info(f"Загружено {len(link_types)} типов связей")
                return link_types
            else:
                self.logger.error(f"Ошибка получения типов связей: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания типов связей: {str(e)}")
            return []
    
    def download_epics(self) -> List[Dict]:
        """
        Скачивание Epic задач
        
        Returns:
            Список Epic задач
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            self.logger.info("Скачивание Epic задач...")
            
            # JQL запрос для получения Epic
            jql = f'type = Epic AND project = {self.project_key} ORDER BY created DESC'
            
            all_epics = []
            start_at = 0
            max_results = 100
            
            while True:
                params = {
                    'jql': jql,
                    'startAt': start_at,
                    'maxResults': max_results,
                    'fields': '*all'
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/search",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                epics = data.get('issues', [])
                all_epics.extend(epics)
                
                total = data.get('total', len(epics))
                if len(epics) < max_results or len(all_epics) >= total:
                    break
                
                start_at += max_results
                time.sleep(0.5)
            
            self.logger.info(f"Загружено {len(all_epics)} Epic задач")
            return all_epics
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания Epic: {str(e)}")
            return []
    
    def download_epic_stories(self, epic_key: str) -> List[Dict]:
        """
        Скачивание задач, связанных с Epic (Story в Epics)
        
        Args:
            epic_key: Ключ Epic задачи
            
        Returns:
            Список Story задач в Epic
        """
        try:
            if not self.session:
                return []
            
            self.logger.info(f"Скачивание Story для Epic {epic_key}...")
            
            jql = f'parent = {epic_key} ORDER BY created DESC'
            
            all_stories = []
            start_at = 0
            max_results = 100
            
            while True:
                params = {
                    'jql': jql,
                    'startAt': start_at,
                    'maxResults': max_results,
                    'fields': 'summary,status,priority,assignee,created,updated'
                }
                
                response = self.session.get(
                    f"{self.base_url}/rest/api/2/search",
                    params=params,
                    headers=self.headers
                )
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                stories = data.get('issues', [])
                all_stories.extend(stories)
                
                if len(stories) < max_results:
                    break
                
                start_at += max_results
            
            return all_stories
            
        except Exception as e:
            self.logger.error(f"Ошибка скачивания Story для Epic: {str(e)}")
            return []
    
    def download_subtasks(self, issue_key: str) -> List[Dict]:
        """
        Скачивание подзадач (sub-tasks) для задачи
        
        Args:
            issue_key: Ключ родительской задачи
            
        Returns:
            Список подзадач
        """
        try:
            if not self.session:
                return []
            
            self.logger.info(f"Скачивание подзадач для {issue_key}...")
            
            jql = f'parent = {issue_key} ORDER BY created DESC'
            
            params = {
                'jql': jql,
                'maxResults': 100,
                'fields': 'summary,status,priority,assignee,created,updated,issuetype'
            }
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/search",
                params=params,
                headers=self.headers
            )
            
            if response.status_code == 200:
                data = response.json()
                subtasks = data.get('issues', [])
                return subtasks
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания подзадач: {str(e)}")
            return []
    
    def download_versions(self, project_key: str = None) -> List[Dict]:
        """
        Скачивание версий проекта
        
        Args:
            project_key: Ключ проекта. Если None - используется из конфигурации.
            
        Returns:
            Список версий
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            project_key = project_key or self.project_key
            self.logger.info(f"Скачивание версий для проекта {project_key}...")
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/project/{project_key}/versions",
                headers=self.headers
            )
            
            if response.status_code == 200:
                versions = response.json()
                self.logger.info(f"Загружено {len(versions)} версий")
                return versions
            else:
                self.logger.error(f"Ошибка получения версий: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания версий: {str(e)}")
            return []
    
    def download_components(self, project_key: str = None) -> List[Dict]:
        """
        Скачивание компонентов проекта
        
        Args:
            project_key: Ключ проекта. Если None - используется из конфигурации.
            
        Returns:
            Список компонентов
        """
        try:
            if not self.session:
                if not self.authenticate():
                    return []
            
            project_key = project_key or self.project_key
            self.logger.info(f"Скачивание компонентов для проекта {project_key}...")
            
            response = self.session.get(
                f"{self.base_url}/rest/api/2/project/{project_key}/components",
                headers=self.headers
            )
            
            if response.status_code == 200:
                components = response.json()
                self.logger.info(f"Загружено {len(components)} компонентов")
                return components
            else:
                self.logger.error(f"Ошибка получения компонентов: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Ошибка скачивания компонентов: {str(e)}")
            return []
    
    # ==================== Методы для сохранения данных ====================
    
    def save_to_json(self, data: Any, filename: str) -> bool:
        """
        Сохранение данных в JSON файл
        
        Args:
            data: Данные для сохранения
            filename: Имя файла (без пути)
            
        Returns:
            True если сохранение успешно
        """
        try:
            filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Данные сохранены в {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка сохранения в JSON: {str(e)}")
            return False
    
    def save_progress(self, data_type: str, data: List[Dict], start_at: int, total: int) -> bool:
        """
        Сохранение промежуточного прогресса
        
        Args:
            data_type: Тип данных (issues, test_cases и т.д.)
            data: Список данных
            start_at: Текущая позиция
            total: Всего записей
            
        Returns:
            True если сохранение успешно
        """
        try:
            # Сохраняем текущую порцию
            self.save_to_json(data, f'{data_type}_partial_{start_at}.json')
            
            # Обновляем прогресс
            progress = {
                'data_type': data_type,
                'start_at': start_at,
                'total': total,
                'loaded': len(data),
                'timestamp': datetime.now().isoformat()
            }
            
            # Сохраняем состояние
            if not hasattr(self, 'progress_file'):
                self.progress_file = os.path.join(self.output_dir, 'progress.json')
            
            # Читаем существующий прогресс
            existing_progress = {}
            if os.path.exists(self.progress_file):
                try:
                    with open(self.progress_file, 'r', encoding='utf-8') as f:
                        existing_progress = json.load(f)
                except:
                    pass
            
            existing_progress[data_type] = progress
            
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(existing_progress, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Прогресс сохранен: {data_type} - {start_at + len(data)}/{total}")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка сохранения прогресса: {str(e)}")
            return False
    
    def load_progress(self, data_type: str) -> Dict:
        """
        Загрузка прогресса для продолжения
        
        Args:
            data_type: Тип данных
            
        Returns:
            Словарь с прогрессом или пустой словарь
        """
        try:
            progress_file = os.path.join(self.output_dir, 'progress.json')
            if os.path.exists(progress_file):
                with open(progress_file, 'r', encoding='utf-8') as f:
                    all_progress = json.load(f)
                    return all_progress.get(data_type, {})
            return {}
        except Exception as e:
            self.logger.warning(f"Ошибка загрузки прогресса: {str(e)}")
            return {}
    
    def get_last_loaded_count(self, data_type: str) -> int:
        """
        Получение количества уже загруженных записей
        
        Args:
            data_type: Тип данных
            
        Returns:
            Количество уже загруженных записей
        """
        try:
            count = 0
            # Ищем частичные файлы
            partial_files = glob.glob(os.path.join(self.output_dir, f'{data_type}_partial_*.json'))
            for pf in partial_files:
                with open(pf, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        count += len(data)
            return count
        except Exception as e:
            self.logger.warning(f"Ошибка подсчета загруженных: {str(e)}")
            return 0
    
    def combine_partial_files(self, data_type: str, final_filename: str) -> List[Dict]:
        """
        Объединение всех частичных файлов в один
        
        Args:
            data_type: Тип данных
            final_filename: Имя финального файла
            
        Returns:
            Объединенный список данных
        """
        try:
            all_data = []
            partial_files = sorted(
                glob.glob(os.path.join(self.output_dir, f'{data_type}_partial_*.json')),
                key=lambda x: int(x.split('_partial_')[1].replace('.json', ''))
            )
            
            for pf in partial_files:
                with open(pf, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_data.extend(data)
            
            if all_data:
                self.save_to_json(all_data, final_filename)
                self.logger.info(f"Объединено {len(all_data)} записей из {len(partial_files)} файлов")
            
            return all_data
            
        except Exception as e:
            self.logger.error(f"Ошибка объединения файлов: {str(e)}")
            return []
    
    def resume_download(self, data_type: str) -> bool:
        """
        Возобновление загрузки с места остановки
        
        Args:
            data_type: Тип данных для возобновления
            
        Returns:
            True если возобновление успешно
        """
        progress = self.load_progress(data_type)
        if not progress:
            self.logger.warning(f"Нет сохраненного прогресса для {data_type}")
            return False
        
        self.logger.info(f"Возобновляем загрузку {data_type} с позиции {progress.get('start_at', 0)}")
        return True
    
    def clear_progress(self, data_type: str = None):
        """
        Очистка сохраненного прогресса
        
        Args:
            data_type: Тип данных. Если None - очистить весь прогресс.
        """
        try:
            if data_type:
                # Удаляем частичные файлы для конкретного типа
                partial_files = glob.glob(os.path.join(self.output_dir, f'{data_type}_partial_*.json'))
                for pf in partial_files:
                    os.remove(pf)
                    self.logger.info(f"Удален файл прогресса: {pf}")
            else:
                # Удаляем все частичные файлы
                partial_files = glob.glob(os.path.join(self.output_dir, '*_partial_*.json'))
                for pf in partial_files:
                    os.remove(pf)
                
                # Удаляем файл прогресса
                progress_file = os.path.join(self.output_dir, 'progress.json')
                if os.path.exists(progress_file):
                    os.remove(progress_file)
                
            self.logger.info("Прогресс очищен")
            
        except Exception as e:
            self.logger.error(f"Ошибка очистки прогресса: {str(e)}")
    
    def save_to_csv(self, data: List[Dict], filename: str, fieldnames: List[str] = None) -> bool:
        """
        Сохранение данных в CSV файл
        
        Args:
            data: Список словарей с данными
            filename: Имя файла (без пути)
            fieldnames: Список полей. Если None - берутся из первого элемента.
            
        Returns:
            True если сохранение успешно
        """
        try:
            if not data:
                self.logger.warning("Нет данных для сохранения в CSV")
                return False
            
            filepath = os.path.join(self.output_dir, filename)
            
            # Определяем поля
            if not fieldnames:
                fieldnames = list(data[0].keys())
            
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            
            self.logger.info(f"Данные сохранены в {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка сохранения в CSV: {str(e)}")
            return False
    
    def flatten_dict(self, d: Dict, parent_key: str = '', sep: str = '_') -> Dict:
        """
        Преобразование вложенного словаря в плоский
        
        Args:
            d: Входной словарь
            parent_key: Ключ родителя
            sep: Разделитель
            
        Returns:
            Плоский словарь
        """
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self.flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                # Списки преобразуем в строку
                items.append((new_key, json.dumps(v, ensure_ascii=False)))
            else:
                items.append((new_key, v))
        return dict(items)
    
    def save_issues_to_csv(self, issues: List[Dict], filename: str = 'issues.csv') -> bool:
        """
        Сохранение задач в CSV с извлечением основных полей
        
        Args:
            issues: Список задач
            filename: Имя файла
            
        Returns:
            True если сохранение успешно
        """
        if not issues:
            return False
        
        # Извлекаем основные поля
        flat_issues = []
        for issue in issues:
            fields = issue.get('fields', {})
            
            flat_issue = {
                'key': issue.get('key'),
                'id': issue.get('id'),
                'summary': fields.get('summary', ''),
                'description': fields.get('description', '')[:500] if fields.get('description') else '',
                'status': fields.get('status', {}).get('name', '') if isinstance(fields.get('status'), dict) else str(fields.get('status', '')),
                'priority': fields.get('priority', {}).get('name', '') if isinstance(fields.get('priority'), dict) else str(fields.get('priority', '')),
                'issuetype': fields.get('issuetype', {}).get('name', '') if isinstance(fields.get('issuetype'), dict) else str(fields.get('issuetype', '')),
                'assignee': fields.get('assignee', {}).get('displayName', '') if isinstance(fields.get('assignee'), dict) else str(fields.get('assignee', '')),
                'reporter': fields.get('reporter', {}).get('displayName', '') if isinstance(fields.get('reporter'), dict) else str(fields.get('reporter', '')),
                'created': fields.get('created', ''),
                'updated': fields.get('updated', ''),
                'duedate': fields.get('duedate', ''),
                'labels': ','.join(fields.get('labels', [])),
                'components': ','.join([c.get('name', '') for c in fields.get('components', [])]),
                'fixVersions': ','.join([v.get('name', '') for v in fields.get('fixVersions', [])]),
                'project': fields.get('project', {}).get('name', '') if isinstance(fields.get('project'), dict) else str(fields.get('project', '')),
                'url': f"{self.base_url}/browse/{issue.get('key')}"
            }
            flat_issues.append(flat_issue)
        
        return self.save_to_csv(flat_issues, filename)
    
    # ==================== Основной метод для полного экспорта ====================
    
    def download_all(self, include_test_cases: bool = True, include_comments: bool = False, resume: bool = True) -> Dict[str, Any]:
        """
        Полный экспорт всех данных из Jira
        
        Args:
            include_test_cases: Включить тест-кейсы
            include_comments: Включить комментарии к задачам
            resume: Продолжить с места остановки
            
        Returns:
            Словарь с результатами экспорта
        """
        results = {
            'projects': [],
            'issues': [],
            'epics': [],
            'test_cases': [],
            'users': [],
            'boards': [],
            'sprints': [],
            'versions': [],
            'components': [],
            'issue_links': [],
            'link_types': []
        }
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 1. Скачиваем проекты
        self.logger.info("=" * 50)
        self.logger.info("Начинаем полный экспорт данных")
        self.logger.info("=" * 50)
        
        projects = self.download_projects()
        results['projects'] = projects
        self.save_to_json(projects, f'projects_{timestamp}.json')
        
        # 2. Скачиваем задачи
        issues = self.download_issues(resume=True)
        results['issues'] = issues
        
        # Объединяем частичные файлы и сохраняем финальный
        if not issues:
            # Пробуем загрузить из частичных файлов
            issues = self.combine_partial_files('issues', f'issues_{timestamp}.json')
        else:
            self.save_to_json(issues, f'issues_{timestamp}.json')
        
        self.save_issues_to_csv(issues, f'issues_{timestamp}.csv')
        
        # 2a. Скачиваем все задачи по типам
        issues_by_type = self.download_all_issue_types()
        if issues_by_type:
            for issue_type, type_issues in issues_by_type.items():
                safe_type_name = issue_type.replace(' ', '_').replace('/', '_')
                self.save_to_json(type_issues, f'issues_{safe_type_name}_{timestamp}.json')
                self.save_issues_to_csv(type_issues, f'issues_{safe_type_name}_{timestamp}.csv')
        
        # 3. Скачиваем комментарии (опционально)
        if include_comments and issues:
            self.logger.info("Скачивание комментариев...")
            all_comments = {}
            for issue in issues[:100]:  # Ограничиваем для производительности
                key = issue.get('key')
                if key:
                    comments = self.download_issue_comments(key)
                    if comments:
                        all_comments[key] = comments
            self.save_to_json(all_comments, f'comments_{timestamp}.json')
        
        # 3a. Скачиваем связи задач
        all_links = self.download_all_issue_links(issues)
        if all_links:
            self.save_to_json(all_links, f'issue_links_{timestamp}.json')
            # Сохраняем в CSV для удобного анализа
            self.save_to_csv(all_links, f'issue_links_{timestamp}.csv')
        
        # 3б. Скачиваем типы связей
        link_types = self.download_link_types()
        if link_types:
            self.save_to_json(link_types, f'link_types_{timestamp}.json')
        
        # 3в. Скачиваем Epic задачи
        epics = self.download_epics()
        results['epics'] = epics
        if epics:
            self.save_to_json(epics, f'epics_{timestamp}.json')
            self.save_issues_to_csv(epics, f'epics_{timestamp}.csv')
        
        # 3г. Скачиваем версии проекта
        versions = self.download_versions()
        if versions:
            self.save_to_json(versions, f'versions_{timestamp}.json')
        
        # 3д. Скачиваем компоненты проекта
        components = self.download_components()
        if components:
            self.save_to_json(components, f'components_{timestamp}.json')
        
        # 4. Скачиваем тест-кейсы
        if include_test_cases:
            test_cases = self.download_test_cases()
            results['test_cases'] = test_cases
            self.save_to_json(test_cases, f'test_cases_{timestamp}.json')
        
        # 5. Скачиваем пользователей
        users = self.download_users(self.project_key)
        results['users'] = users
        self.save_to_json(users, f'users_{timestamp}.json')
        
        # 6. Скачиваем доски
        boards = self.download_boards(self.project_key)
        results['boards'] = boards
        self.save_to_json(boards, f'boards_{timestamp}.json')
        
        # 7. Скачиваем спринты для каждой доски
        for board in boards:
            board_id = board.get('id')
            if board_id:
                sprints = self.download_sprints(board_id)
                results['sprints'].extend(sprints)
        
        if results['sprints']:
            self.save_to_json(results['sprints'], f'sprints_{timestamp}.json')
        
        # Сохраняем общий отчет
        summary = {
            'export_date': datetime.now().isoformat(),
            'jira_url': self.base_url,
            'project_key': self.project_key,
            'counts': {
                'projects': len(results['projects']),
                'issues': len(results['issues']),
                'issues_by_type': {k: len(v) for k, v in issues_by_type.items()} if issues_by_type else {},
                'issue_links': len(all_links),
                'link_types': len(link_types),
                'test_cases': len(results['test_cases']),
                'users': len(results['users']),
                'boards': len(results['boards']),
                'sprints': len(results['sprints'])
            }
        }
        self.save_to_json(summary, f'export_summary_{timestamp}.json')
        
        self.logger.info("=" * 50)
        self.logger.info("Экспорт завершен!")
        self.logger.info(f"Проектов: {len(results['projects'])}")
        self.logger.info(f"Задач: {len(results['issues'])}")
        self.logger.info(f"Связей задач: {len(results['issue_links'])}")
        self.logger.info(f"Типов связей: {len(results['link_types'])}")
        self.logger.info(f"Тест-кейсов: {len(results['test_cases'])}")
        self.logger.info(f"Пользователей: {len(results['users'])}")
        self.logger.info(f"Досок: {len(results['boards'])}")
        self.logger.info(f"Спринтов: {len(results['sprints'])}")
        self.logger.info("=" * 50)
        
        return results


# ==================== Пример использования ====================

def main():
    """Пример использования JiraDownloader"""
    
    # Способ 1: Использование конфигурации из .env
    print("=" * 60)
    print("Jira Downloader - Парсер для скачивания данных из Jira")
    print("=" * 60)
    
    downloader = JiraDownloader()
    
    # Выполняем полный экспорт
    results = downloader.download_all(
        include_test_cases=True,
        include_comments=False
    )
    
    print("\n✅ Экспорт завершен!")
    print(f"📁 Файлы сохранены в директории: {downloader.output_dir}")


if __name__ == "__main__":
    main()
