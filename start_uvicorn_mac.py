import uvicorn
from app.core.config import settings
import logging
from colorama import init, Back, Fore, Style

init(autoreset=True)

class YellowInfoFormatter(logging.Formatter):
    def format(self, record):
        if record.levelname == "INFO":
            record.msg = f"{Back.YELLOW}{Fore.BLACK}{record.msg}{Style.RESET_ALL}"
        return super().format(record)

if __name__ == "__main__":
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["default"]["()"] = YellowInfoFormatter

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.APP_PORT,
        reload=True
    )
