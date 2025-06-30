from pathlib import Path
import re

def collect_static_files():
    base = Path(__file__).resolve().parents[1] / "static"

    def files(exts):
        result = []
        for f in base.rglob("*"):
            if (
                f.suffix in exts and
                f.is_file() and
                "/dist/" not in str(f).replace("\\", "/")
            ):
                rel_path = str(f).replace("\\", "/")
                # Remove everything before and including '/static'
                m = re.search(r"/static(/.*)$", rel_path)
                if m:
                    rel_path = "/static" + m.group(1)
                else:
                    rel_path = "/static/" + f.relative_to(base).as_posix()
                result.append(rel_path)
        return sorted(result)

    dev_css = files((".css",))
    js_all = files((".js",))

    dev_js_modules = [
        f for f in js_all
        if not f.endswith("govbr-ds/core.min.js")
    ]
    dev_js_files = [
        f for f in js_all
        if f.endswith("govbr-ds/core.min.js")
    ]

    return dev_css, dev_js_modules, dev_js_files
