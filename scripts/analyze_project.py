import os
import ast
import json
import re
from typing import Dict, List, Set
from dataclasses import dataclass
from pathlib import Path


@dataclass
class EntityAnalysis:
    name: str
    backend_fields: Dict[str, str]  # campo -> tipo
    frontend_interface_fields: Dict[str, str]  # campo -> tipo
    frontend_type_fields: Dict[str, str]
    database_fields: Set[str]
    endpoints: List[str]
    service_methods: List[str]
    next_routes: List[str]
    components: List[str]  # Componentes relacionados
    validations: Dict[str, List[str]]  # campo -> lista de validações
    duplicate_routes: List[tuple]  # Lista de rotas duplicadas
    table_structure: Dict[str, str]  # coluna -> tipo
    related_tables: List[str]  # Tabelas relacionadas
    crud_routes: Dict[str, List[str]]  # pasta -> rotas
    cadastros_structure: Dict[str, List[str]]  # Estrutura de cadastros


class ProjectAnalyzer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.frontend_dir = self.project_root / 'frontend'
        self.backend_dir = self.project_root
        self.entities: Dict[str, EntityAnalysis] = {}

    def analyze_backend_models(self):
        """Analisa as classes/modelos do backend (FastAPI)"""
        print("\nAnalisando modelos do backend...")
        app_py = self.backend_dir / "app.py"

        with open(app_py, "r", encoding="utf-8") as f:
            content = f.read()

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    # Ignora classes internas ou utilitárias
                    if not node.name.startswith("_"):
                        fields = {}
                        field_types = set()
                        for child in node.body:
                            if isinstance(child, ast.AnnAssign) and isinstance(
                                child.target, ast.Name
                            ):
                                fields[child.target.id] = "unknown"
                                try:
                                    if isinstance(child.annotation, ast.Name):
                                        field_type = child.annotation.id
                                    elif isinstance(child.annotation, ast.Subscript):
                                        if isinstance(child.annotation.slice, ast.Name):
                                            field_type = f"{child.annotation.value.id}[{child.annotation.slice.id}]"
                                        elif isinstance(child.annotation.slice, ast.Constant):
                                            field_type = f"{child.annotation.value.id}[{child.annotation.slice.value}]"
                                        else:
                                            field_type = child.annotation.value.id
                                    else:
                                        field_type = "unknown"
                                except:
                                    field_type = "unknown"
                                field_types.add(field_type)
                                fields[child.target.id] = field_type

                        if node.name not in self.entities:
                            self.entities[node.name] = EntityAnalysis(
                                name=node.name,
                                backend_fields=fields,
                                frontend_interface_fields={},
                                frontend_type_fields=field_types,
                                database_fields=set(),
                                endpoints=[],
                                service_methods=[],
                                next_routes=[],
                                components=[],
                                validations={},
                                duplicate_routes=[],
                                table_structure={},
                                related_tables=[],
                                crud_routes={},
                                cadastros_structure={}
                            )
                        else:
                            self.entities[node.name].backend_fields = fields
                            self.entities[node.name].frontend_type_fields = field_types
        except Exception as e:
            print(f"Erro ao analisar modelos do backend: {e}")
            import traceback
            traceback.print_exc()

    def analyze_frontend_interfaces(self):
        """Analisa as interfaces TypeScript do frontend"""
        print("\nAnalisando interfaces do frontend...")
        types_dir = self.frontend_dir / "src" / "types"

        if not types_dir.exists():
            print(f"Diretório de tipos não encontrado: {types_dir}")
            return

        for file in types_dir.glob("*.ts"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()

                # Encontra interfaces
                interface_pattern = r"interface\s+(\w+)\s*{([^}]*)}"
                for match in re.finditer(interface_pattern, content):
                    name = match.group(1)
                    fields_block = match.group(2)

                    # Extrai campos da interface
                    fields = {}
                    for line in fields_block.split("\n"):
                        field_match = re.match(r"\s*(\w+)\??:\s*(\w+);", line)
                        if field_match:
                            fields[field_match.group(1)] = field_match.group(2)

                    if name not in self.entities:
                        self.entities[name] = EntityAnalysis(
                            name=name,
                            backend_fields={},
                            frontend_interface_fields=fields,
                            frontend_type_fields=set(),
                            database_fields=set(),
                            endpoints=[],
                            service_methods=[],
                            next_routes=[],
                            components=[],
                            validations={},
                            duplicate_routes=[],
                            table_structure={},
                            related_tables=[],
                            crud_routes={},
                            cadastros_structure={}
                        )
                    else:
                        self.entities[name].frontend_interface_fields = fields
            except Exception as e:
                print(f"Erro ao analisar interface {file}: {e}")
                import traceback
                traceback.print_exc()

    def analyze_endpoints(self):
        """Analisa os endpoints FastAPI"""
        print("\nAnalisando endpoints FastAPI...")
        app_py = self.backend_dir / "app.py"

        with open(app_py, "r", encoding="utf-8") as f:
            content = f.read()

        # Encontra decoradores de rota
        route_pattern = r'@app\.(get|post|put|delete)\([\'"]([^\'"]+)[\'"]\)'
        for match in re.finditer(route_pattern, content):
            method = match.group(1)
            path = match.group(2)

            # Tenta identificar a entidade baseado no path
            parts = path.strip("/").split("/")
            if parts:
                entity_name = parts[0].title().rstrip("s")  # Remove 's' do plural
                if entity_name in self.entities:
                    self.entities[entity_name].endpoints.append(
                        f"{method.upper()} {path}"
                    )

    def analyze_database_functions(self):
        """Analisa as funções de banco de dados"""
        print("\nAnalisando funções de banco de dados...")
        db_file = self.backend_dir / "database_supabase.py"

        with open(db_file, "r", encoding="utf-8") as f:
            content = f.read()

        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    # Procura por funções que manipulam entidades
                    for entity_name in self.entities:
                        entity_lower = entity_name.lower()
                        if entity_lower in node.name:
                            self.entities[entity_name].database_fields.add(node.name)
        except Exception as e:
            print(f"Erro ao analisar funções de banco de dados: {e}")
            import traceback
            traceback.print_exc()

    def analyze_frontend_services(self):
        """Analisa os serviços do frontend"""
        print("\nAnalisando serviços do frontend...")
        services_dir = self.frontend_dir / "src" / "services"

        if not services_dir.exists():
            print(f"Diretório de serviços não encontrado: {services_dir}")
            return

        for file in services_dir.glob("*.ts"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()

                # Encontra funções exportadas
                export_pattern = r"export\s+(?:async\s+)?function\s+(\w+)"
                for match in re.finditer(export_pattern, content):
                    method_name = match.group(1)

                    # Associa com entidade baseado no nome do arquivo
                    entity_name = file.stem.replace("Service", "").title()
                    if entity_name in self.entities:
                        self.entities[entity_name].service_methods.append(method_name)
            except Exception as e:
                print(f"Erro ao analisar serviço {file}: {e}")
                import traceback
                traceback.print_exc()

    def analyze_next_routes(self):
        """Analisa as rotas do Next.js dentro da pasta (auth)"""
        print("\nAnalisando rotas do Next.js...")
        auth_dir = self.frontend_dir / "src" / "app" / "(auth)"

        if not auth_dir.exists():
            print(f"Diretório (auth) não encontrado: {auth_dir}")
            return

        for path in auth_dir.rglob("page.tsx"):
            try:
                # Remove (auth) do caminho para ter a rota real
                route = (
                    str(path.relative_to(auth_dir))
                    .replace("\\", "/")
                    .replace("/page.tsx", "")
                )

                # Tenta associar com uma entidade
                parts = route.split("/")
                for part in parts:
                    # Normaliza o nome da entidade
                    entity_name = part.title().rstrip("s")  # Remove 's' do plural
                    # Casos especiais
                    if entity_name == "Cadastro":
                        # Verifica o próximo nível para entidades em pastas de cadastro
                        next_index = parts.index(part) + 1
                        if next_index < len(parts):
                            entity_name = parts[next_index].title().rstrip("s")

                    if entity_name in self.entities:
                        full_route = f"/(auth){route}"
                        self.entities[entity_name].next_routes.append(full_route)
                        print(f"Rota encontrada para {entity_name}: {full_route}")
            except Exception as e:
                print(f"Erro ao analisar rota {path}: {e}")
                import traceback
                traceback.print_exc()

    def analyze_table_structure(self):
        """Analisa a estrutura das tabelas no arquivo SQL"""
        print("\nAnalisando estrutura das tabelas...")
        try:
            sql_file = self.project_root / 'sql' / 'criar_tabelas.sql'
            
            if not sql_file.exists():
                print(f"Arquivo SQL não encontrado: {sql_file}")
                return
            
            with open(sql_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Procura por criação de tabelas
            # Padrão atualizado para capturar comentários e constraints
            table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);'
            for match in re.finditer(table_pattern, content, re.IGNORECASE):
                table_name = match.group(1).lower()  # Normaliza para lowercase
                columns_def = match.group(2)
                
                # Normaliza o nome da tabela para o nome da entidade
                entity_name = table_name.rstrip('s').title()
                
                if entity_name not in self.entities:
                    continue
                
                # Extrai colunas e tipos
                # Atualizado para capturar comentários e constraints
                column_pattern = r'(\w+)\s+([\w\(\)]+)(?:\s+(?:DEFAULT\s+[^,]+|NOT\s+NULL|PRIMARY\s+KEY|UNIQUE|CHECK\s*\([^)]+\)))*(?:\s+--\s*(.+?))?(?:,|$)'
                table_structure = {}
                comments = {}
                
                for col_match in re.finditer(column_pattern, columns_def, re.IGNORECASE):
                    col_name = col_match.group(1)
                    col_type = col_match.group(2)
                    comment = col_match.group(3)
                    
                    table_structure[col_name] = {
                        'type': col_type,
                        'comment': comment.strip() if comment else None
                    }
                
                # Procura por chaves estrangeiras
                fk_pattern = r'FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)'
                related_tables = []
                for fk_match in re.finditer(fk_pattern, columns_def, re.IGNORECASE):
                    fk_column = fk_match.group(1)
                    referenced_table = fk_match.group(2)
                    related_tables.append({
                        'column': fk_column,
                        'references': referenced_table
                    })
                
                # Procura por índices
                index_pattern = r'(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)'
                indexes = []
                for idx_match in re.finditer(index_pattern, content, re.IGNORECASE):
                    index_name = idx_match.group(1)
                    table = idx_match.group(2)
                    columns = [c.strip() for c in idx_match.group(3).split(',')]
                    if table.lower() == table_name:
                        indexes.append({
                            'name': index_name,
                            'columns': columns,
                            'unique': 'UNIQUE' in idx_match.group(0).upper()
                        })
                
                # Atualiza a estrutura da entidade
                self.entities[entity_name].table_structure = {
                    'columns': table_structure,
                    'comments': comments,
                    'foreign_keys': related_tables,
                    'indexes': indexes
                }
                
                self.entities[entity_name].related_tables = [fk['references'] for fk in related_tables]
        
        except Exception as e:
            print(f"Erro ao analisar estrutura das tabelas: {e}")
            import traceback
            traceback.print_exc()

    def analyze_crud_routes(self):
        """Analisa as rotas CRUD em diferentes locais do frontend"""
        print("\nAnalisando rotas CRUD...")
        auth_dir = self.frontend_dir / 'src' / 'app' / '(auth)'
        
        if not auth_dir.exists():
            print(f"Diretório (auth) não encontrado: {auth_dir}")
            return
        
        # Analisa rotas diretas e em /cadastros
        for entity in self.entities.values():
            crud_routes = {
                "root": [],  # Rotas na raiz
                "cadastros": [],  # Rotas em /cadastros
                "outros": []  # Outras localizações
            }
            
            # Procura em todas as pastas
            for route in entity.next_routes:
                if '/cadastros/' in route:
                    crud_routes["cadastros"].append(route)
                elif route.count('/') == 2:  # Rota na raiz
                    crud_routes["root"].append(route)
                else:
                    crud_routes["outros"].append(route)
            
            entity.crud_routes = crud_routes

    def analyze_cadastros_structure(self):
        """Analisa a estrutura específica da página de cadastros"""
        print("\nAnalisando estrutura da página de cadastros...")
        cadastros_dir = self.frontend_dir / 'src' / 'app' / '(auth)' / 'cadastros'
        
        if not cadastros_dir.exists():
            print(f"Diretório de cadastros não encontrado: {cadastros_dir}")
            return
        
        # Estrutura para armazenar informações dos cadastros
        cadastros_info = {}
        
        # Analisa cada subdiretório em cadastros
        for entity_dir in cadastros_dir.iterdir():
            if not entity_dir.is_dir():
                continue
                
            entity_name = entity_dir.name.rstrip('s').title()
            
            cadastros_info[entity_name] = {
                'pages': [],
                'components': [],
                'forms': [],
                'tables': [],
                'services': []
            }
            
            # Analisa arquivos na pasta da entidade
            for file in entity_dir.rglob('*'):
                if not file.is_file():
                    continue
                    
                relative_path = file.relative_to(cadastros_dir)
                
                # Identifica tipos de arquivos
                if file.name == 'page.tsx':
                    cadastros_info[entity_name]['pages'].append(str(relative_path))
                elif 'Form' in file.name:
                    cadastros_info[entity_name]['forms'].append(str(relative_path))
                elif 'Table' in file.name:
                    cadastros_info[entity_name]['tables'].append(str(relative_path))
                elif file.parent.name == 'components':
                    cadastros_info[entity_name]['components'].append(str(relative_path))
                elif file.parent.name == 'services':
                    cadastros_info[entity_name]['services'].append(str(relative_path))
            
            # Analisa conteúdo dos arquivos
            for file in entity_dir.rglob('*.tsx'):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Procura por chamadas à API
                    api_pattern = r'(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*[\'"`](.*?)[\'"`]'
                    for match in re.finditer(api_pattern, content):
                        endpoint = match.group(1)
                        if entity_name in self.entities:
                            self.entities[entity_name].endpoints.append(endpoint)
                    
                    # Procura por componentes do shadcn/ui
                    shadcn_pattern = r'from\s+["\'](.*?)/ui/.*?["\']'
                    shadcn_components = set()
                    for match in re.finditer(shadcn_pattern, content):
                        component = match.group(1).split('/')[-1]
                        shadcn_components.add(component)
                    
                    if shadcn_components:
                        cadastros_info[entity_name]['ui_components'] = list(shadcn_components)
                    
                except Exception as e:
                    print(f"Erro ao analisar arquivo {file}: {e}")
        
        # Atualiza as entidades com as informações dos cadastros
        for entity_name, info in cadastros_info.items():
            if entity_name in self.entities:
                self.entities[entity_name].cadastros_structure = info
    
    def analyze_project(self):
        """Executa a análise completa do projeto"""
        print("Iniciando análise do projeto...")
        
        self.analyze_backend_models()
        self.analyze_frontend_interfaces()
        self.analyze_endpoints()
        self.analyze_database_functions()
        self.analyze_frontend_services()
        self.analyze_next_routes()
        self.analyze_table_structure()
        self.analyze_crud_routes()
        self.analyze_cadastros_structure()  # Nova análise
        self.generate_report()

    def find_inconsistencies(self, entity: EntityAnalysis) -> List[str]:
        """Encontra inconsistências em uma entidade"""
        inconsistencies = []
        
        # Verifica campos e tipos
        if entity.backend_fields and entity.frontend_interface_fields:
            backend_fields = set(entity.backend_fields.keys())
            frontend_fields = set(entity.frontend_interface_fields.keys())
            
            missing_in_frontend = backend_fields - frontend_fields
            missing_in_backend = frontend_fields - backend_fields
            
            if missing_in_frontend:
                inconsistencies.append(f"Campos faltando no frontend: {', '.join(missing_in_frontend)}")
            if missing_in_backend:
                inconsistencies.append(f"Campos faltando no backend: {', '.join(missing_in_backend)}")
            
            # Verifica tipos incompatíveis
            for field in backend_fields & frontend_fields:
                backend_type = entity.backend_fields[field]
                frontend_type = entity.frontend_interface_fields[field]
                if not self.are_types_compatible(backend_type, frontend_type):
                    inconsistencies.append(f"Tipo incompatível para {field}: backend={backend_type}, frontend={frontend_type}")
        
        # Verifica campos da tabela vs campos do modelo
        if entity.table_structure and 'columns' in entity.table_structure:
            table_fields = set(entity.table_structure['columns'].keys())
            model_fields = set(entity.backend_fields.keys())
            
            missing_in_table = model_fields - table_fields
            missing_in_model = table_fields - model_fields
            
            if missing_in_table:
                inconsistencies.append(f"Campos do modelo ausentes na tabela: {', '.join(missing_in_table)}")
            if missing_in_model:
                inconsistencies.append(f"Campos da tabela ausentes no modelo: {', '.join(missing_in_model)}")
            
            # Verifica tipos SQL vs tipos do modelo
            for field in table_fields & model_fields:
                sql_type = entity.table_structure['columns'][field]['type'].upper()
                model_type = entity.backend_fields[field]
                if not self.are_sql_types_compatible(sql_type, model_type):
                    inconsistencies.append(f"Tipo SQL incompatível para {field}: sql={sql_type}, model={model_type}")
        
        # Verifica rotas CRUD duplicadas
        if entity.crud_routes:
            if entity.crud_routes["root"] and entity.crud_routes["cadastros"]:
                inconsistencies.append(
                    f"Rotas CRUD duplicadas:\n" +
                    f"  - Root: {', '.join(entity.crud_routes['root'])}\n" +
                    f"  - Cadastros: {', '.join(entity.crud_routes['cadastros'])}"
                )
        
        # Verifica estrutura de cadastros
        if hasattr(entity, 'cadastros_structure') and entity.cadastros_structure:
            cadastros = entity.cadastros_structure
            
            # Verifica se tem formulário
            if 'forms' in cadastros and not cadastros['forms']:
                inconsistencies.append(f"Formulário de cadastro não encontrado em /cadastros/{entity.name.lower()}s")
            
            # Verifica se tem tabela de listagem
            if 'tables' in cadastros and not cadastros['tables']:
                inconsistencies.append(f"Tabela de listagem não encontrada em /cadastros/{entity.name.lower()}s")
            
            # Verifica se tem página principal
            if 'pages' in cadastros and not cadastros['pages']:
                inconsistencies.append(f"Página principal não encontrada em /cadastros/{entity.name.lower()}s")
            
            # Verifica duplicação de funcionalidade
            entity_route = f"/(auth)/{entity.name.lower()}s"
            cadastro_route = f"/(auth)/cadastros/{entity.name.lower()}s"
            
            if entity_route in entity.next_routes and cadastro_route in entity.next_routes:
                inconsistencies.append(
                    f"Funcionalidade duplicada:\n" +
                    f"  - Rota principal: {entity_route}\n" +
                    f"  - Rota de cadastro: {cadastro_route}"
                )
        
        return inconsistencies

    def generate_report(self):
        """Gera um relatório detalhado da análise"""
        print("\nGerando relatório...")
        
        def set_to_list(obj):
            if isinstance(obj, set):
                return list(obj)
            return obj
        
        report = {
            "timestamp": "2025-02-02T12:22:25-03:00",
            "entities": {}
        }

        for name, entity in self.entities.items():
            report["entities"][name] = {
                "backend_fields": entity.backend_fields,
                "frontend_interface_fields": entity.frontend_interface_fields,
                "frontend_type_fields": list(entity.frontend_type_fields),
                "database_fields": list(entity.database_fields),
                "endpoints": entity.endpoints,
                "service_methods": entity.service_methods,
                "next_routes": entity.next_routes,
                "components": entity.components,
                "validations": entity.validations,
                "duplicate_routes": entity.duplicate_routes,
                "table_structure": entity.table_structure,
                "related_tables": entity.related_tables,
                "crud_routes": entity.crud_routes,
                "cadastros_structure": entity.cadastros_structure,
                "inconsistencies": self.find_inconsistencies(entity)
            }

        # Salva o relatório
        report_path = self.project_root / 'analysis_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=set_to_list)
        
        print(f"\nRelatório gerado em: {report_path}")

    def are_types_compatible(self, backend_type: str, frontend_type: str) -> bool:
        # Implementação simplificada para verificar compatibilidade de tipos
        # Pode ser expandida para lidar com mais casos
        if backend_type == frontend_type:
            return True
        
        # Verifica se o tipo do backend é um array e o frontend é um tipo simples
        if backend_type.endswith('[]') and frontend_type == backend_type[:-2]:
            return True
        
        return False

    def are_sql_types_compatible(self, sql_type: str, model_type: str) -> bool:
        """Verifica compatibilidade entre tipos SQL e tipos do modelo"""
        # Mapeamento de tipos SQL para tipos Python
        sql_to_python = {
            'INTEGER': ['int', 'Optional[int]'],
            'BIGINT': ['int', 'Optional[int]'],
            'SMALLINT': ['int', 'Optional[int]'],
            'VARCHAR': ['str', 'Optional[str]'],
            'TEXT': ['str', 'Optional[str]'],
            'BOOLEAN': ['bool', 'Optional[bool]'],
            'TIMESTAMP': ['datetime', 'Optional[datetime]'],
            'DATE': ['date', 'Optional[date]'],
            'NUMERIC': ['float', 'Decimal', 'Optional[float]', 'Optional[Decimal]'],
            'DECIMAL': ['float', 'Decimal', 'Optional[float]', 'Optional[Decimal]'],
            'FLOAT': ['float', 'Optional[float]'],
            'DOUBLE': ['float', 'Optional[float]'],
            'JSON': ['dict', 'Optional[dict]', 'Any'],
            'JSONB': ['dict', 'Optional[dict]', 'Any']
        }
        
        # Normaliza o tipo SQL (remove parâmetros como tamanho)
        base_sql_type = sql_type.split('(')[0].upper()
        
        # Verifica se o tipo do modelo é compatível com o tipo SQL
        if base_sql_type in sql_to_python:
            return model_type in sql_to_python[base_sql_type]
        
        return False

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    analyzer = ProjectAnalyzer(project_root)
    analyzer.analyze_project()
