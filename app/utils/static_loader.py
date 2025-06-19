from pathlib import Path

def collect_static_files():
    base = Path(__file__).resolve().parents[1] / "static"

    def files(exts):
        return sorted([
            str(f).replace("\\", "/").replace(str(base), "/static")
            for f in base.rglob("*")
            if (
                f.suffix in exts and
                f.is_file() and
                "/dist/" not in str(f).replace("\\", "/")
            )
        ])

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
