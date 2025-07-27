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

    # Separate CSS files based on directory structure and patterns
    base_css = []
    template_css = []
    
    for css_file in all_css:
        css_path = Path(css_file)
        
        # Priority 1: Files in /css/common/ directory (always base CSS)
        if "/css/common/" in css_file:
            base_css.append(css_file)
        # Priority 2: Third-party/framework files (by directory pattern)
        elif any(framework_dir in css_file for framework_dir in ["/fonts/"]):
            base_css.append(css_file)
        # Priority 3: Core component files (in root css directory, not template-specific)
        elif css_path.parent.name == "css" and any(
            component_type in css_path.stem.lower() for component_type in [
                "app", "base", "header", "menu", "table", "financial"
            ]
        ):
            base_css.append(css_file)
        # Everything else is template-specific
        else:
            template_css.append(css_file)

    # Sort to ensure consistent order (common files first, govbr-ds first within common)
    base_css.sort(key=lambda x: (
        0 if "/css/common/govbr-ds/" in x else 
        1 if "/css/common/" in x else 
        2 if "/fonts/" in x else 
        3
    ))

    # Separate JS files: first by location (common first), then by type
    common_js_files = []      # Scripts from /js/common/
    common_js_modules = []    # Modules from /js/common/
    other_js_files = []       # Scripts from other locations
    other_js_modules = []     # Modules from other locations
    
    for js_file in all_js:
        js_path = Path(js_file)
        is_common = "/js/common/" in js_file
        # ECharts ESM is a module, not a regular script
        is_script = (js_path.suffix == ".js" and 
                    ".min.js" in js_path.name and 
                    "echarts.esm" not in js_path.name)
        
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

    # Sort common JS files to ensure govbr-ds comes first, then echarts
    common_js_files.sort(key=lambda x: (
        0 if "/js/common/govbr-ds/" in x else 
        1 if "echarts" in x else
        2
    ))
    
    # Sort common JS modules similarly
    common_js_modules.sort(key=lambda x: (
        0 if "/js/common/govbr-ds/" in x else 
        1 if "echarts" in x else
        2
    ))

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
    
    # Scan all CSS files recursively for template-specific matches
    for css_file in base.rglob("*.css"):
        if css_file.is_file():
            file_stem = css_file.stem.lower()
            
            # Skip files in common/ directory (these are base CSS)
            if "common" in css_file.parts:
                continue
                
            # Skip files that are clearly framework/component files
            if any(framework_pattern in file_stem for framework_pattern in [
                "app", "base", "header", "menu", "table", "financial"
            ]):
                continue
            
            # Check if this file matches the template name patterns
            if any(pattern in file_stem for pattern in template_patterns):
                rel_path = f"/static/{css_file.relative_to(base.parent).as_posix()}"
                template_css.append(rel_path)
    
    return sorted(template_css)
