from pathlib import Path
import re

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
            '/static/css/app.css': 10,
            '/static/css/base.css': 11,
            '/static/css/header.css': 12,
            '/static/css/menu.css': 13
        }
        
        if "/css/common/govbr-ds/" in x:
            return (0, x)
        elif "/css/common/" in x:
            return (1, x)
        elif "/fonts/" in x:
            return (2, x)
        elif x in priority_files:
            return (3, priority_files[x], x)
        else:
            return (4, x)  # Rest alphabetically
    
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

    # Sort JS files: govbr-ds first, then alphabetically
    def js_sort_key(x):
        return (
            0 if "/js/common/govbr-ds/" in x else 
            1 if "echarts" in x.lower() else
            2,
            x  # Secondary sort alphabetically
        )
    
    common_js_files.sort(key=js_sort_key)
    common_js_modules.sort(key=js_sort_key)
    other_js_files.sort()
    other_js_modules.sort()

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
