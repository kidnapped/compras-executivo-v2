from fastapi.templating import Jinja2Templates
from app.core.config import settings
from app.utils.static_loader import collect_static_files

templates = Jinja2Templates(directory="app/templates")

dev_css_files, dev_js_modules, dev_js_files = collect_static_files()

templates.env.globals["config"] = settings
templates.env.globals["dev_css_files"] = dev_css_files
templates.env.globals["dev_js_modules"] = dev_js_modules
templates.env.globals["dev_js_files"] = dev_js_files
templates.env.globals.update(settings.model_dump())
