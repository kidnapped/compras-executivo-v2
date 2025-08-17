from pathlib import Path
import re

def get_app_js_imports():
    """Extrai recursivamente todos os arquivos JS que são importados direta ou indiretamente pelo app.js"""
    app_js_path = Path(__file__).resolve().parents[1] / "static" / "js" / "app.js"
    
    if not app_js_path.exists():
        return set()
    
    imported_files = set()
    processed_files = set()  # Para evitar loops infinitos
    
    def extract_imports_from_file(file_path, relative_to_js_dir=True):
        """Extrai imports de um arquivo JS específico, ignorando comentários"""
        if not file_path.exists():
            return set()
        
        # Evitar processar o mesmo arquivo várias vezes
        file_key = str(file_path.resolve())
        if file_key in processed_files:
            return set()
        processed_files.add(file_key)
        
        file_imports = set()
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remover comentários de linha (//) e comentários de bloco (/* */)
            # Primeiro, remover comentários de bloco
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            # Depois, remover comentários de linha (mas preservar strings que contenham //)
            lines = content.split('\n')
            cleaned_lines = []
            for line in lines:
                # Encontrar // que não estão dentro de strings
                in_string = False
                string_char = None
                comment_pos = None
                
                for i, char in enumerate(line):
                    if not in_string and char in ['"', "'"]:
                        in_string = True
                        string_char = char
                    elif in_string and char == string_char and (i == 0 or line[i-1] != '\\'):
                        in_string = False
                        string_char = None
                    elif not in_string and char == '/' and i + 1 < len(line) and line[i + 1] == '/':
                        comment_pos = i
                        break
                
                if comment_pos is not None:
                    line = line[:comment_pos]
                
                cleaned_lines.append(line)
            
            content = '\n'.join(cleaned_lines)
            
            # Regex para capturar imports ES6 (tanto ./ quanto ../)
            import_patterns = [
                r'import\s+.*?\s+from\s+["\'](\./.*?\.js)["\']',   # import something from "./path/file.js"
                r'import\s+.*?\s+from\s+["\'](\.\./.*?\.js)["\']', # import something from "../path/file.js"
                r'import\s+["\'](\./.*?\.js)["\']',                # import "./path/file.js" 
                r'import\s+["\'](\.\./.*?\.js)["\']',              # import "../path/file.js"
                r'import\(["\'](\./.*?\.js)["\']\)',               # import("./path/file.js")
                r'import\(["\'](\.\./.*?\.js)["\']\)',             # import("../path/file.js")
            ]
            
            js_dir = Path(__file__).resolve().parents[1] / "static" / "js"
            
            for pattern in import_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                for match in matches:
                    # Resolver path relativo para path absoluto
                    if relative_to_js_dir:
                        # Import relativo ao diretório js/ (para app.js)
                        # Para app.js, todos os imports são relativos ao diretório js/
                        if match.startswith('./'):
                            clean_path = match[2:]  # Remove ./
                            import_file_path = js_dir / clean_path
                        elif match.startswith('../'):
                            # Para app.js, ../algo seria relativo ao parent de js/, mas não deveria acontecer
                            # Trata como se fosse relativo ao js/ mesmo
                            clean_path = match[3:]  # Remove ../
                            import_file_path = js_dir / clean_path
                        else:
                            import_file_path = js_dir / match
                    else:
                        # Import relativo ao arquivo atual (para arquivos dentro de subdiretórios)
                        import_file_path = file_path.parent / match
                    
                    # Normalizar o path
                    try:
                        import_file_path = import_file_path.resolve()
                        # Verificar se o arquivo está dentro do diretório js/
                        js_dir_resolved = js_dir.resolve()
                        
                        if js_dir_resolved in import_file_path.parents or import_file_path.parent == js_dir_resolved:
                            # Converter para path relativo para usar no HTML
                            rel_path = import_file_path.relative_to(js_dir_resolved.parent)
                            full_path = f"/static/{rel_path.as_posix()}"
                            
                            # Garantir que o path está correto (deve conter /js/)
                            if "/js/" in full_path:
                                file_imports.add(full_path)
                                
                                # Recursivamente buscar imports no arquivo importado
                                # SEMPRE usar relative_to_js_dir=False para arquivos recursivos
                                recursive_imports = extract_imports_from_file(import_file_path, False)
                                file_imports.update(recursive_imports)
                    except (ValueError, OSError):
                        # Ignorar paths que não conseguimos resolver
                        continue
            
        except Exception as e:
            print(f"⚠️ Erro ao ler {file_path}: {e}")
        
        return file_imports
    
    # Começar a análise recursiva a partir do app.js
    imported_files = extract_imports_from_file(app_js_path, True)
    
    if imported_files:
        print(f"📋 {len(imported_files)} arquivos JS importados detectados recursivamente no app.js (excluídos do HTML)")
        # Para debug, mostrar alguns dos arquivos encontrados
        if len(imported_files) <= 10:
            for f in sorted(imported_files):
                print(f"   - {f}")
        else:
            for f in sorted(list(imported_files)[:5]):
                print(f"   - {f}")
            print(f"   ... e mais {len(imported_files) - 5} arquivos")
    
    return imported_files

def collect_static_files():
    base = Path(__file__).resolve().parents[1] / "static"
    css_dir = base / "css"
    js_dir = base / "js"

    def get_files_in_dir(directory, extensions):
        """Get all files with specific extensions in a directory"""
        result = []
        if directory.exists():
            for f in directory.rglob("*"):
                if (
                    f.suffix in extensions and
                    f.is_file() and
                    "/dist/" not in str(f).replace("\\", "/")
                ):
                    rel_path = f"/static/{f.relative_to(base).as_posix()}"
                    result.append(rel_path)
        return sorted(result)

    # Get all CSS and JS files dynamically
    all_css = get_files_in_dir(css_dir, (".css",))
    all_js = get_files_in_dir(js_dir, (".js",))
    
    # Get imports from app.js to exclude duplicates
    app_js_imports = get_app_js_imports()
    
    # Exclude JS files that are already imported in app.js
    # Keep app.js itself and spa_router.js as they are entry points
    essential_files = {"/static/js/app.js", "/static/js/spa_router.js"}
    
    filtered_js = []
    excluded_count = 0
    
    for js_file in all_js:
        if js_file in essential_files:
            # Always include essential entry point files
            filtered_js.append(js_file)
        elif js_file in app_js_imports:
            # Exclude files that are imported in app.js
            excluded_count += 1
        else:
            # Include files not imported in app.js
            filtered_js.append(js_file)
    
    if excluded_count > 0:
        print(f"📊 {excluded_count} arquivos JS excluídos para evitar duplicação com app.js")
    all_js = filtered_js
    
    # Add other static files (fonts only - echarts and govbr-ds now moved to common/)
    for subdir in ["fonts"]:
        subdir_path = base / subdir
        if subdir_path.exists():
            all_css.extend(get_files_in_dir(subdir_path, (".css",)))
            all_js.extend(get_files_in_dir(subdir_path, (".js",)))

    # In development mode, include ALL CSS files as base CSS for simplicity
    # This ensures all styles are available without having to manage complex categorization
    # Exclude login.css and outros-templates.css in development mode
    base_css = [css for css in all_css if not (css.endswith('/login.css') or css.endswith('/outros-templates.css'))]
    template_css = []  # No template-specific CSS in development

    # Sort CSS files: common framework files first, then priority files, then alphabetically
    def css_sort_key(x):
        # Priority order for specific CSS files
        priority_files = {
            '/static/css/app/spa.css': 9,
            '/static/css/app/app.css': 10,
            '/static/css/app/base.css': 11,
            '/static/css/app/header.css': 12,
            '/static/css/app/menu.css': 13
        }
        
        if "/css/common/govbr-ds/" in x:
            return (0, x)
        elif "/css/common/" in x:
            return (1, x)
        elif "/fonts/" in x:
            return (2, x)
        elif x in priority_files:
            return (3, priority_files[x], x)
        elif x.startswith('/static/css/app/'):  # App subdirectory files come first
            return (4, x)
        elif x.startswith('/static/css/') and x.count('/') == 3:  # Root CSS files (/static/css/file.css)
            return (5, x)
        elif x.startswith('/static/css/') and x.count('/') > 3:  # Other subdirectory CSS files
            return (6, x)
        else:
            return (7, x)  # Rest alphabetically
    
    base_css.sort(key=css_sort_key)

    # Separate JS files dynamically: scripts vs modules
    common_js_files = []      # Scripts from /js/common/
    common_js_modules = []    # Modules from /js/common/
    other_js_files = []       # Scripts from other locations
    other_js_modules = []     # Modules from other locations
    
    for js_file in all_js:
        js_path = Path(js_file)
        is_common = "/js/common/" in js_file
        
        # Determine if it's a script or module based on file characteristics
        # Scripts: .min.js files (typically pre-minified libraries)
        # Modules: .js files that are not minified (ES6 modules)
        is_script = ".min.js" in js_path.name
        
        if is_common:
            if is_script:
                common_js_files.append(js_file)
            else:
                common_js_modules.append(js_file)
        else:
            if is_script:
                other_js_files.append(js_file)
            else:
                other_js_modules.append(js_file)

    # Sort JS files: govbr-ds first, then priority files, then alphabetically
    def js_sort_key(x):
        # Priority order for specific JS files
        priority_js_files = {
            '/static/js/util/echarts.js': 10,
            '/static/js/app.js': 11
        }
        
        if "/js/common/govbr-ds/" in x:
            return (0, x)
        elif "echarts" in x.lower() and x not in priority_js_files:
            return (1, x)
        elif x in priority_js_files:
            return (2, priority_js_files[x], x)
        elif "/js/app/" in x:
            return (3, x)  # App directory files
        else:
            return (4, x)  # Rest alphabetically
    
    common_js_files.sort(key=js_sort_key)
    common_js_modules.sort(key=js_sort_key)
    other_js_files.sort(key=js_sort_key)
    other_js_modules.sort(key=js_sort_key)

    # Combine: common files first within each category
    # Scripts (no type="module"): common scripts first, then others
    dev_js_files = common_js_files + other_js_files
    # Modules (type="module"): common modules first, then others  
    dev_js_modules = common_js_modules + other_js_modules

    return dev_js_files, dev_js_modules, base_css, template_css

def get_template_specific_css(template_name):
    """Get CSS files specific to a template - completely dynamic based on file naming patterns"""
    if not template_name:
        return []
    
    base = Path(__file__).resolve().parents[1] / "static" / "css"
    
    if not base.exists():
        return []
    
    template_css = []
    template_lower = template_name.lower()

    # Generate all possible template name variations for matching
    template_patterns = {
        template_lower,
        template_lower.replace("-", "_"),
        template_lower.replace("_", "-"),
        template_lower.replace("-", ""),
        template_lower.replace("_", "")
    }

    # Get the base CSS files to exclude duplicates
    try:
        _, _, base_css, _ = collect_static_files()
        base_css_set = set(base_css)
    except Exception:
        base_css_set = set()

    # Scan all CSS files recursively for template-specific matches
    for css_file in base.rglob("*.css"):
        if css_file.is_file():
            file_stem = css_file.stem.lower()

            # Skip files in common/ directory (these are framework files)
            if "common" in css_file.parts:
                continue

            # Check if this file matches any of the template name patterns
            if any(pattern in file_stem for pattern in template_patterns):
                rel_path = f"/static/{css_file.relative_to(base.parent).as_posix()}"
                if rel_path not in base_css_set:
                    template_css.append(rel_path)

    return sorted(template_css)
