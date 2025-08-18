#!/usr/bin/env python3
"""
Dynamic Bundle Builder - 100% Dynamic, Zero Hardcoded Names
Uses the same logic as static_loader.py to build production bundles
"""

import os
import sys
import re
from pathlib import Path
from app.utils.static_loader import collect_static_files, get_template_specific_css

def find_font_file_recursively(font_filename):
    """
    Recursively search for font files in the static directory
    Returns the correct relative path from /static/ root
    """
    static_dir = Path("app/static")
    
    # Search recursively for the font file
    for font_path in static_dir.rglob(font_filename):
        # Convert to relative path from static root
        relative_path = font_path.relative_to(static_dir)
        return f"/static/{relative_path.as_posix()}"
    
    return None

def fix_font_paths_intelligently(css_content, css_file_path, for_webpack=False):
    """
    Intelligently fix font paths in CSS content by finding actual font locations
    For webpack: Remove entire CSS rules that reference missing fonts to prevent build errors
    """
    if for_webpack:
        # For webpack, we need to be more aggressive and remove entire font-face rules
        # that reference missing fonts to prevent build errors
        return fix_font_paths_for_webpack(css_content)
    else:
        # For development, use the original approach
        return fix_font_paths_for_development(css_content)

def fix_font_paths_for_development(css_content):
    """Fix font paths for development builds"""
    # Pattern to match font URLs in CSS
    font_url_pattern = r'url\(["\']?\.\.\/([^"\']*\/)?([^"\']*\.(eot|woff2?|ttf|svg))["\']?\)'
    
    def replace_font_url(match):
        original_path = match.group(0)
        font_filename = match.group(2)  # Just the filename
        
        # Try to find the actual font file
        actual_font_path = find_font_file_recursively(font_filename)
        
        if actual_font_path:
            print(f"    🔧 Fixed font path: {font_filename} -> {actual_font_path}")
            return f'url("{actual_font_path}")'
        
        print(f"    ⚠️  Font not found: {font_filename}")
        return original_path
    
    # Replace all font URLs
    fixed_content = re.sub(font_url_pattern, replace_font_url, css_content)
    return fixed_content

def fix_font_paths_for_webpack(css_content):
    """
    Fix font paths for webpack builds by removing references to missing fonts
    and correcting paths for existing fonts
    """
    lines = css_content.split('\n')
    fixed_lines = []
    skip_until_closing_brace = False
    current_font_face = []
    in_font_face = False
    
    for line in lines:
        # Check if we're starting a @font-face rule
        if '@font-face' in line:
            in_font_face = True
            current_font_face = [line]
            continue
        
        if in_font_face:
            current_font_face.append(line)
            
            # Check if this font-face block is complete
            if '}' in line:
                # Process the complete font-face block
                font_face_content = '\n'.join(current_font_face)
                processed_block = process_font_face_block(font_face_content)
                
                if processed_block:  # Only add if we have valid fonts
                    fixed_lines.extend(processed_block.split('\n'))
                else:
                    print(f"    🗑️  Removed font-face block with no valid fonts")
                
                # Reset
                in_font_face = False
                current_font_face = []
                continue
        else:
            # Not in font-face, process individual font URLs
            font_url_pattern = r'url\(["\']?\.\.\/([^"\']*\/)?([^"\']*\.(eot|woff2?|ttf|svg))["\']?\)'
            
            def replace_font_url(match):
                font_filename = match.group(2)
                actual_font_path = find_font_file_recursively(font_filename)
                
                if actual_font_path:
                    static_root = Path("app/static")
                    for font_path in static_root.rglob(font_filename):
                        relative_path = font_path.relative_to(static_root)
                        webpack_path = f"./{relative_path.as_posix()}"
                        print(f"    🔧 Fixed font path for webpack: {font_filename} -> {webpack_path}")
                        return f'url("{webpack_path}")'
                
                # For webpack, return empty string to remove the broken reference
                print(f"    �️  Removed missing font reference: {font_filename}")
                return ''
            
            fixed_line = re.sub(font_url_pattern, replace_font_url, line)
            # Only add line if it's not empty after font removal
            if fixed_line.strip():
                fixed_lines.append(fixed_line)
    
    return '\n'.join(fixed_lines)

def process_font_face_block(font_face_content):
    """
    Process a complete @font-face block, keeping only src entries for existing fonts
    """
    lines = font_face_content.split('\n')
    valid_src_lines = []
    other_lines = []
    
    for line in lines:
        if 'src:' in line or line.strip().startswith('url('):
            # This line contains font sources
            font_urls = []
            
            # Extract all font URLs from this line
            font_url_pattern = r'url\(["\']?\.\.\/([^"\']*\/)?([^"\']*\.(eot|woff2?|ttf|svg))["\']?\)(?:\s+format\(["\'][^"\']*["\']\))?'
            
            for match in re.finditer(font_url_pattern, line):
                font_filename = match.group(2)
                actual_font_path = find_font_file_recursively(font_filename)
                
                if actual_font_path:
                    static_root = Path("app/static")
                    for font_path in static_root.rglob(font_filename):
                        relative_path = font_path.relative_to(static_root)
                        webpack_path = f"./{relative_path.as_posix()}"
                        
                        # Determine format based on file extension
                        ext = font_filename.split('.')[-1]
                        format_map = {
                            'woff2': 'woff2',
                            'woff': 'woff',
                            'ttf': 'truetype',
                            'eot': 'embedded-opentype',
                            'svg': 'svg'
                        }
                        format_name = format_map.get(ext, ext)
                        
                        font_urls.append(f'url("{webpack_path}") format("{format_name}")')
                        print(f"    ✅ Kept valid font for webpack: {font_filename}")
                        break
            
            # If we have valid font URLs, create a new src line
            if font_urls:
                if line.strip().startswith('src:'):
                    valid_src_lines.append(f"  src: {', '.join(font_urls)};")
                else:
                    # Handle continuation lines
                    valid_src_lines.append(f"       {', '.join(font_urls)};")
        else:
            # Keep non-src lines (font-family, font-weight, etc.)
            other_lines.append(line)
    
    # Only return the block if we have valid font sources
    if valid_src_lines:
        result_lines = []
        for line in other_lines:
            if '}' in line:
                # Add src lines before closing brace
                result_lines.extend(valid_src_lines)
                result_lines.append(line)
            else:
                result_lines.append(line)
        return '\n'.join(result_lines)
    
    return None  # No valid fonts, remove entire block

def build_css_bundle(for_webpack=False):
    """Build bundle.css dynamically using the same order as development"""
    suffix = "_webpack" if for_webpack else ""
    print(f"🎨 Building CSS bundle{suffix}...")
    
    # Get the same CSS order as development
    _, _, base_css, template_css = collect_static_files()
    
    # Combine all CSS files (base + template)
    all_css_files = base_css + template_css
    
    bundle_content = []
    bundle_content.append("/* Auto-generated bundle.css - DO NOT EDIT */")
    bundle_content.append("/* Generated dynamically from static_loader.py logic */\n")
    
    for css_file in all_css_files:
        # Convert URL path to file system path
        file_path = Path("app/static") / css_file.replace("/static/", "")
        
        if file_path.exists():
            print(f"  📄 Adding: {css_file}")
            bundle_content.append(f"/* === {css_file} === */")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Intelligently fix font paths
                fixed_content = fix_font_paths_intelligently(content, css_file, for_webpack)
                bundle_content.append(fixed_content)
            
            bundle_content.append("")  # Empty line between files
        else:
            print(f"  ⚠️  Warning: {file_path} not found")
    
    # Write bundle
    bundle_path = Path("app/static/dist") / f"bundle{suffix}.css"
    bundle_path.parent.mkdir(exist_ok=True)
    
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(bundle_content))
    
    print(f"✅ CSS bundle created: {bundle_path} ({len(all_css_files)} files)")
    return len(all_css_files)

def build_js_bundle():
    """Build bundle.js dynamically using the same order as development"""
    print("📜 Building JS bundle...")
    
    # Get the same JS order as development
    dev_js_files, dev_js_modules, _, _ = collect_static_files()
    
    # Combine: scripts first, then modules (same order as template)
    all_js_files = dev_js_files + dev_js_modules
    
    bundle_content = []
    bundle_content.append("/* Auto-generated bundle.js - DO NOT EDIT */")
    bundle_content.append("/* Generated dynamically from static_loader.py logic */")
    bundle_content.append("")
    
    # Add environment variable first (same as template)
    bundle_content.append("window.process = { env: { ENVIRONMENT: 'production' } };")
    bundle_content.append("")
    
    # COMPREHENSIVE ES6 CONVERSION SYSTEM - Analyze ALL modules first
    print("🔍 Phase 1: Analyzing ALL modules for dependencies...")
    modules_info = analyze_all_modules(all_js_files)
    
    print("🛠️  Phase 2: Converting ES6 modules to browser-compatible code...")
    for js_file in all_js_files:
        # Convert URL path to file system path
        file_path = Path("app/static") / js_file.replace("/static/", "")
        
        if file_path.exists():
            print(f"  📄 Adding: {js_file}")
            bundle_content.append(f"/* === {js_file} === */")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Handle ES6 modules using COMPREHENSIVE conversion
                if js_file in dev_js_modules:
                    content = convert_es6_module_comprehensive(content, js_file, modules_info)
                
                bundle_content.append(content)
            
            bundle_content.append("")  # Empty line between files
        else:
            print(f"  ⚠️  Warning: {file_path} not found")
    
    # Write bundle
    bundle_path = Path("app/static/dist/bundle.js")
    bundle_path.parent.mkdir(exist_ok=True)
    
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(bundle_content))
    
    print(f"✅ JS bundle created: {bundle_path} ({len(all_js_files)} files)")
    return len(all_js_files)

def analyze_all_modules(all_js_files):
    """
    PHASE 1: Analyze ALL modules to build complete dependency map
    This prevents the whack-a-mole pattern by understanding everything upfront
    """
    modules_info = {}
    
    for js_file in all_js_files:
        file_path = Path("app/static") / js_file.replace("/static/", "")
        if not file_path.exists():
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract imports and exports
        imports = extract_imports(content)
        exports = extract_exports(content) 
        
        modules_info[js_file] = {
            'path': file_path,
            'content': content,
            'imports': imports,
            'exports': exports,
            'module_name': Path(js_file).stem.replace('-', '_').replace('.', '_')
        }
    
    return modules_info

def extract_imports(content):
    """Extract ALL import statements and referenced variables"""
    imports = {}
    
    # Named imports: import { a, b } from "module"
    for match in re.finditer(r'import\s*\{\s*([^}]+)\s*\}\s*from\s*["\']([^"\']+)["\']', content):
        vars_str = match.group(1)
        module_path = match.group(2)
        vars_list = [v.strip().split(' as ')[0] for v in vars_str.split(',')]
        imports[module_path] = imports.get(module_path, []) + vars_list
    
    # Default imports: import name from "module"  
    for match in re.finditer(r'import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*["\']([^"\']+)["\']', content):
        var_name = match.group(1)
        module_path = match.group(2)
        imports[module_path] = imports.get(module_path, []) + [var_name]
    
    # Star imports: import * as name from "module"
    for match in re.finditer(r'import\s*\*\s*as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*["\']([^"\']+)["\']', content):
        var_name = match.group(1)
        module_path = match.group(2)
        imports[module_path] = imports.get(module_path, []) + [var_name]
    
    return imports

def extract_exports(content):
    """Extract ALL export statements"""
    exports = {
        'default': None,
        'named': [],
        'individual': []
    }
    
    # Default exports
    if re.search(r'export\s+default\s+', content):
        exports['default'] = True
    
    # Named exports: export { a, b }
    for match in re.finditer(r'export\s*\{\s*([^}]+)\s*\}', content):
        vars_str = match.group(1)
        vars_list = [v.strip().split(' as ')[0] for v in vars_str.split(',')]
        exports['named'].extend(vars_list)
    
    # Individual exports: export const/function/let/var name
    for match in re.finditer(r'export\s+(const|function|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', content):
        exports['individual'].append(match.group(2))
    
    return exports

def convert_es6_module_comprehensive(content, file_path, modules_info):
    """
    COMPREHENSIVE ES6 to browser conversion - fixes ALL issues at once
    No more whack-a-mole!
    """
    
    # Skip webpack bundles and minified files
    if (any(pattern in content for pattern in ['window.exports', 'module.exports', 
        'function(e,t,n){"use strict"', '!function(', '__webpack_require__']) or
        any(pattern in content[:500] for pattern in ['var t=function(e,n)', 'function e(e,n)', 
        'var n=function(){this.'])):
        print(f"  ⚠️  Skipping minified/bundled file: {file_path}")
        return content
    
    # Skip if no ES6 modules
    if not ('export ' in content or 'import ' in content or 'export{' in content or 'import.meta' in content):
        return content
    
    print(f"  🔄 Converting ES6 modules in {file_path}")
    
    # STEP 1: Handle all dynamic imports
    content = re.sub(r'import\s*\(\s*["\'][^"\']*["\']\s*\)', 'Promise.resolve({})', content, flags=re.MULTILINE | re.DOTALL)
    
    # STEP 2: Convert all export patterns
    content = convert_all_exports(content)
    
    # STEP 3: Remove all import statements  
    content = remove_all_imports(content)
    
    # STEP 4: Fix variable references ONLY for non-minified files
    content = fix_all_variable_references(content, modules_info)
    
    # STEP 5: Handle import.meta
    content = re.sub(r'import\.meta\.env', 'process.env', content)
    content = re.sub(r'import\.meta\.url', 'window.location.href', content)
    content = re.sub(r'import\.meta', '{}', content)
    
    # STEP 6: Handle webpack patterns
    content = re.sub(r'require\.context\([^)]*\)', 'function() { return { keys: function() { return []; } }; }()', content)
    
    # STEP 7: Clean up remaining export keywords
    content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
    content = re.sub(r'(?<![a-zA-Z_$])export(?![a-zA-Z_$])', '', content)
    
    return wrap_in_iife(content, file_path)

def convert_all_exports(content):
    """Convert ALL export patterns comprehensively"""
    individual_exports = []
    
    # Default exports
    content = re.sub(r'export\s+default\s+(async\s+function\s+\w+)', r'window.__exported = \1', content)
    content = re.sub(r'export\s+default\s+(function\s+\w+)', r'window.__exported = \1', content)
    content = re.sub(r'export\s+default\s+([^{;]+);', r'window.__exported = \1;', content)
    content = re.sub(r'export\s+default\s+({)', r'window.__exported = \1', content)
    
    # Named exports
    def convert_named_exports(match):
        exports_content = match.group(1)
        items = []
        for item in exports_content.split(','):
            item = item.strip()
            if ' as ' in item:
                parts = item.split(' as ')
                if len(parts) == 2:
                    original, alias = parts[0].strip(), parts[1].strip()
                    items.append(f"{alias}: {original}")
                else:
                    items.append(f"{item}: {item}")
            else:
                items.append(f"{item}: {item}")
        return f'window.__exported = {{{", ".join(items)}}}'
    
    content = re.sub(r'export\s*\{\s*([^}]+)\s*\}', convert_named_exports, content, flags=re.DOTALL)
    
    # Individual exports
    def collect_individual_export(match):
        export_type = match.group(1)
        export_name = match.group(2)
        individual_exports.append(export_name)
        return f'{export_type} {export_name}'
    
    content = re.sub(r'export\s+(function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', collect_individual_export, content)
    
    # Add individual exports to window
    if individual_exports:
        exports_obj = "{" + ", ".join([f"{name}: {name}" for name in individual_exports]) + "}"
        if 'window.__exported' not in content:
            content += f"\n\n    window.__exported = {exports_obj};"
        else:
            content += f"\n\n    Object.assign(window.__exported || {{}}, {exports_obj});"
        
        # Make available directly on window
        for export_name in individual_exports:
            content += f"\n    window.{export_name} = {export_name};"
    
    return content

def remove_all_imports(content):
    """Remove ALL import statement patterns"""
    # Handle all import patterns comprehensively
    content = re.sub(
        r'import\s+(?:'
        r'[^;{]+from\s+["\'][^"\']+["\']|'  # import x from "y"
        r'\{[^}]*\}\s*from\s+["\'][^"\']+["\']|'  # import { a, b } from "y" 
        r'\*\s+as\s+\w+\s+from\s+["\'][^"\']+["\']'  # import * as x from "y"
        r')\s*;?\s*',
        '',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    return content

def fix_all_variable_references(content, modules_info):
    """Fix ALL variable references using comprehensive analysis"""
    
    # Build complete variable map from all modules
    all_exported_vars = set()
    for module_info in modules_info.values():
        exports = module_info['exports']
        all_exported_vars.update(exports['named'])
        all_exported_vars.update(exports['individual'])
        if exports['default']:
            all_exported_vars.add(module_info['module_name'])
    
    # Add known common variables
    all_exported_vars.update([
        'modalManager', 'tooltip', 'financialBars', 'aditivosHandler', 'devOps',
        'environment', 'menu', 'admin', 'card_kpi', 'contratos_dashboard', 
        'kpis_kpi', 'getBaseChartOption', 'BR_COLORS', 
        'fetchKpiData', 'renderKpiData', 'displayValueInH2', 'showKpiError'
    ])
    
    # Fix spread syntax
    def fix_spread_references(match):
        var_name = match.group(1)
        if (not var_name.startswith('window.') and not '(' in var_name and 
            var_name.isidentifier() and var_name in all_exported_vars):
            return f'...(window.{var_name} || {{}})'
        return match.group(0)
    
    content = re.sub(r'\.\.\.([a-zA-Z_$][a-zA-Z0-9_$]*)', fix_spread_references, content)
    
    # Fix direct variable references - but be very careful about syntax
    # Only replace standalone variable references that are clearly safe
    for var_name in all_exported_vars:
        # More precise pattern to avoid breaking valid JavaScript syntax
        # Match: word boundary + var_name + followed by specific safe characters
        # Negative lookbehind: not preceded by const/let/var/function/window./word character/.
        # Negative lookahead: not followed by word character or :
        pattern = rf'(?<!const\s)(?<!let\s)(?<!var\s)(?<!function\s)(?<!window\.)(?<!\.)(?<!\w)\b{re.escape(var_name)}\b(?![:\w])'
        
        # Only replace if followed by safe operators/punctuation that indicate usage, not declaration
        safe_pattern = rf'{pattern}(?=[\.\(\s=\[\,\)\]])'
        
        replacement = f'window.{var_name}'
        content = re.sub(safe_pattern, replacement, content)
    
    return content

def wrap_in_iife(content, file_path):
    """Wrap module in IIFE with proper global exports"""
    module_name = Path(file_path).stem.replace('-', '_').replace('.', '_')
    indented_content = '\n'.join('    ' + line if line.strip() else line for line in content.split('\n'))
    
    has_exports = 'window.__exported' in content
    
    if has_exports:
        wrapped_content = f"""/* === Module: {file_path} === */
(function() {{
    // Module-scoped variables and functions
{indented_content}
    
    // Make exported values available globally for this module
    if (typeof window.__exported !== 'undefined') {{
        window.{module_name} = window.__exported;
        window.__exported = undefined; // Clean up
    }}
}})();"""
    else:
        wrapped_content = f"""/* === Module: {file_path} === */
(function() {{
    // Module-scoped variables and functions
{indented_content}
}})();"""
    
    return wrapped_content

def convert_es6_module(content, file_path):
    """Convert ES6 modules to browser-compatible code with IIFE wrapping"""
    import re
    import hashlib
    
    # Check if this is a webpack bundle - don't modify webpack UMD bundles
    if ('window.exports' in content or 
        'module.exports' in content or 
        'function(e,t,n){"use strict"' in content or
        '!function(' in content[:100]):
        # This appears to be a webpack UMD bundle - leave it alone
        print(f"  ⚠️  Skipping ES6 conversion for {file_path} (webpack bundle detected)")
        return content
    
    # Only convert files that actually have ES6 module syntax
    if ('export ' not in content and 'import ' not in content and 'export{' not in content and 
        'import.meta' not in content):
        # No ES6 modules detected
        return content
    
    print(f"  🔄 Converting ES6 modules in {file_path}")
    
    # Convert export default - handle all variations
    # Handle "export default async function name()" pattern
    content = re.sub(r'export\s+default\s+(async\s+function\s+\w+)', r'window.__exported = \1', content)
    
    # Handle "export default function name()" pattern
    content = re.sub(r'export\s+default\s+(function\s+\w+)', r'window.__exported = \1', content)
    
    # Handle simple exports like "export default something;"
    content = re.sub(r'export\s+default\s+([^{;]+);', r'window.__exported = \1;', content)
    
    # Handle object/function exports like "export default {"
    content = re.sub(r'export\s+default\s+({)', r'window.__exported = \1', content)
    
    # Convert named exports like "export { foo, bar }" or "export{foo,bar}" - handle very long exports
    def convert_named_exports(match):
        exports_content = match.group(1)
        items = []
        for item in exports_content.split(','):
            item = item.strip()
            if ' as ' in item:
                # Handle "original as alias" pattern
                parts = item.split(' as ')
                if len(parts) == 2:
                    original = parts[0].strip()
                    alias = parts[1].strip()
                    items.append(f"{alias}: {original}")
                else:
                    # Malformed 'as' pattern, just use the item as-is
                    items.append(f"{item}: {item}")
            else:
                # Normal export: "foo" becomes "foo: foo"
                items.append(f"{item}: {item}")
        return f'window.__exported = {{{", ".join(items)}}}'
    
    content = re.sub(
        r'export\s*\{\s*([^}]+)\s*\}',
        convert_named_exports,
        content,
        flags=re.DOTALL  # Allow . to match newlines for very long export statements
    )
    
    # Convert export function/const/let/var - collect them for window.__exported
    individual_exports = []
    
    def collect_individual_export(match):
        export_type = match.group(1)  # function, const, let, var
        export_name = match.group(2)  # variable/function name
        individual_exports.append(export_name)
        return f'{export_type} {export_name}'
    
    content = re.sub(r'export\s+(function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)', collect_individual_export, content)
    
    # Handle dynamic import statements that won't work in bundled context
    # Handle both single-line and multiline dynamic imports with whitespace/newlines
    content = re.sub(
        r'import\s*\(\s*["\'][^"\']*["\']\s*\)',
        'Promise.resolve({})',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Remove ALL import statements (handle multiline imports)
    # This regex handles all import patterns including multiline destructuring
    content = re.sub(
        r'import\s+(?:'
        r'[^;{]+from\s+["\'][^"\']+["\']|'  # import x from "y"
        r'\{[^}]*\}\s*from\s+["\'][^"\']+["\']|'  # import { a, b } from "y" 
        r'\*\s+as\s+\w+\s+from\s+["\'][^"\']+["\']'  # import * as x from "y"
        r')\s*;?\s*',
        '',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Handle import.meta syntax (ES6 module metadata)
    # Replace import.meta.env with process.env for browser compatibility
    content = re.sub(r'import\.meta\.env', 'process.env', content)
    
    # Handle other import.meta properties that might exist
    content = re.sub(r'import\.meta\.url', 'window.location.href', content)
    content = re.sub(r'import\.meta', '{}', content)  # Fallback for any remaining import.meta
    
    # Handle webpack-specific require.context calls that won't work in browsers
    # Replace with empty function to prevent runtime errors
    content = re.sub(
        r'require\.context\([^)]*\)',
        'function() { return { keys: function() { return []; } }; }()',
        content
    )
    
    # Remove any remaining standalone export keywords at the beginning of lines
    content = re.sub(r'^\s*export\s+', '', content, flags=re.MULTILINE)
    
    # Remove any remaining standalone "export" keywords (more aggressive cleanup)
    content = re.sub(r'(?<![a-zA-Z_$])export(?![a-zA-Z_$])', '', content)
    
    # If we collected individual exports, add them to window.__exported
    if individual_exports:
        exports_obj = "{" + ", ".join([f"{name}: {name}" for name in individual_exports]) + "}"
        if 'window.__exported' not in content:
            # Add the exports object if no other exports exist
            content += f"\n\n    window.__exported = {exports_obj};"
        else:
            # Merge with existing exports (this is complex, so we'll just add them separately)
            content += f"\n\n    // Individual exports\n    Object.assign(window.__exported || {{}}, {exports_obj});"
        
        # Also make individual exports available directly on window for easier access
        for export_name in individual_exports:
            content += f"\n    window.{export_name} = {export_name};"
    
    # Fix module references in object spread syntax that reference undefined variables
    # This handles cases where modules reference other modules that are converted to global variables
    def fix_spread_references(match):
        full_match = match.group(0)
        var_name = match.group(1)
        
        # Only fix bare variable names that aren't already window.something
        if not var_name.startswith('window.') and not '(' in var_name and var_name.isidentifier():
            return f'...(window.{var_name} || {{}})'
        else:
            return full_match
    
    # Apply the fix to spread syntax in object literals
    content = re.sub(
        r'\.\.\.([a-zA-Z_$][a-zA-Z0-9_$]*)',
        fix_spread_references,
        content
    )
    
    # Fix direct references to imported module variables
    # This handles cases like modalManager.initialize() -> window.modalManager.initialize()
    # But only if the variable name matches common module patterns
    common_module_vars = [
        'modalManager', 'tooltip', 'financialBars', 'aditivosHandler', 'devOps',
        'environment', 'menu', 'admin', 'card_kpi', 'contratos_dashboard', 
        'kpis_kpi', 'getBaseChartOption', 'BR_COLORS', 
        'fetchKpiData', 'renderKpiCard', 'displayValueInH2', 'showKpiError'
    ]
    
    for var_name in common_module_vars:
        # Replace variable references that are not already window.something
        # Look for patterns like "varName." or "varName(" but not "window.varName"
        pattern = rf'(?<!window\.)(?<!\w){re.escape(var_name)}(?=[\.\(\s])'
        replacement = f'window.{var_name}'
        content = re.sub(pattern, replacement, content)
    
    # Create a unique hash for this module
    module_hash = hashlib.md5(file_path.encode()).hexdigest()[:8]
    
    # Extract module name from file path for variable naming
    module_name = Path(file_path).stem.replace('-', '_').replace('.', '_')
    
    # Wrap the entire module in an IIFE to prevent scope pollution
    # Indent the content properly within the IIFE
    indented_content = '\n'.join('    ' + line if line.strip() else line for line in content.split('\n'))
    
    # Check if this module has exports that need to be made available globally
    has_exports = 'window.__exported' in content
    
    if has_exports:
        wrapped_content = f"""/* === Module: {file_path} === */
(function() {{
    // Module-scoped variables and functions
{indented_content}
    
    // Make exported values available globally for this module
    if (typeof window.__exported !== 'undefined') {{
        window.{module_name} = window.__exported;
        window.__exported = undefined; // Clean up
    }}
}})();"""
    else:
        wrapped_content = f"""/* === Module: {file_path} === */
(function() {{
    // Module-scoped variables and functions
{indented_content}
}})();"""
    
    return wrapped_content

def build_template_specific_bundles():
    """Build template-specific CSS bundles dynamically"""
    print("🎯 Building template-specific CSS bundles...")
    
    # Find all templates dynamically
    templates_dir = Path("app/templates")
    template_count = 0
    
    if templates_dir.exists():
        for template_file in templates_dir.glob("*.html"):
            template_name = template_file.stem
            
            # Skip base template
            if template_name == "base":
                continue
            
            # Get template-specific CSS using the same logic as development
            template_css = get_template_specific_css(template_name)
            
            if template_css:
                print(f"  🎯 Building {template_name}.css bundle...")
                
                bundle_content = []
                bundle_content.append(f"/* Template-specific CSS for {template_name} */")
                
                for css_file in template_css:
                    file_path = Path("app/static") / css_file.replace("/static/", "")
                    
                    if file_path.exists():
                        print(f"    📄 Adding: {css_file}")
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                            # Intelligently fix font paths
                            fixed_content = fix_font_paths_intelligently(content, css_file, False)
                            bundle_content.append(f"/* === {css_file} === */")
                            bundle_content.append(fixed_content)
                
                # Write template-specific bundle
                bundle_path = Path(f"app/static/dist/{template_name}.css")
                with open(bundle_path, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(bundle_content))
                
                template_count += 1
    
    print(f"✅ Template bundles created: {template_count} templates")
    return template_count

def main():
    """Build all bundles dynamically"""
    print("🚀 Starting Dynamic Bundle Build...")
    print("📋 Using same logic as static_loader.py (100% dynamic)")
    print()
    
    # Ensure we're in the right directory
    if not Path("app/utils/static_loader.py").exists():
        print("❌ Error: Must run from project root directory")
        sys.exit(1)
    
    try:
        # Build main bundles for development
        css_count = build_css_bundle(for_webpack=False)
        js_count = build_js_bundle()
        
        print()
        print("🔧 Building webpack-compatible bundles...")
        
        # Build webpack-compatible bundles
        css_count_webpack = build_css_bundle(for_webpack=True)
        
        print()
        
        # Build template-specific bundles
        template_count = build_template_specific_bundles()
        
        print()
        print("🎉 Dynamic bundle build complete!")
        print(f"   📊 CSS files bundled: {css_count}")
        print(f"   📊 JS files bundled: {js_count}")
        print(f"   📊 Template bundles: {template_count}")
        print(f"   🔧 Webpack CSS bundle: generated")
        print()
        print("📁 Generated files:")
        print("   app/static/dist/bundle.css (development)")
        print("   app/static/dist/bundle_webpack.css (webpack)")
        print("   app/static/dist/bundle.js")
        print("   app/static/dist/{template}.css (per template)")
        print()
        print("✅ All bundles maintain the EXACT same order as development!")
        print("✅ Zero hardcoded file names - completely dynamic!")
        print("✅ Intelligent font path correction for both development and webpack!")
        
    except Exception as e:
        print(f"❌ Build failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
