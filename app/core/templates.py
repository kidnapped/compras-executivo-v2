from fastapi.templating import Jinja2Templates
from app.core.config import settings
from app.utils.static_loader import collect_static_files, get_template_specific_css

templates = Jinja2Templates(directory="app/templates")

dev_js_files, dev_js_modules, base_css_files, template_css_files = collect_static_files()

templates.env.globals["config"] = settings
templates.env.globals["base_css_files"] = base_css_files
templates.env.globals["template_css_files"] = template_css_files
templates.env.globals["dev_js_modules"] = dev_js_modules
templates.env.globals["dev_js_files"] = dev_js_files
templates.env.globals["get_template_specific_css"] = get_template_specific_css
templates.env.globals.update(settings.model_dump())
