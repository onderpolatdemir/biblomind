"""Enhanced logging configuration for BiblioMind."""

import logging
import sys
import json
import uuid
from datetime import datetime
from typing import Any, Dict
from contextvars import ContextVar

from app.core.config import settings


# Context variable for request ID tracking
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.
    
    Outputs logs as JSON for better parsing in production environments.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_data["extra"] = record.extra
        
        return json.dumps(log_data, default=str)


class ConsoleFormatter(logging.Formatter):
    """
    Human-readable console formatter with request ID.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record for console."""
        request_id = request_id_var.get()
        request_prefix = f"[{request_id[:8]}] " if request_id else ""
        
        # Original format
        formatted = super().format(record)
        
        return f"{request_prefix}{formatted}"


def setup_logging():
    """
    Configure application logging with JSON support.
    
    - Development: Human-readable console output
    - Production: JSON-formatted structured logs
    """
    # Configure log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Choose formatter based on environment
    if settings.ENVIRONMENT == "production" and settings.LOG_FORMAT == "json":
        formatter = JSONFormatter()
    else:
        formatter = ConsoleFormatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()  # Remove existing handlers
    root_logger.addHandler(console_handler)
    
    # Reduce noise from external libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    
    # Create app logger
    logger = logging.getLogger("bibliomind")
    logger.info(f"Logging configured - Level: {settings.LOG_LEVEL}, Format: {settings.LOG_FORMAT}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    return logger


def get_request_id() -> str:
    """Get current request ID from context."""
    return request_id_var.get()


def set_request_id(request_id: str = None) -> str:
    """
    Set request ID for current context.
    
    Args:
        request_id: Request ID (generated if not provided)
    
    Returns:
        Request ID
    """
    if not request_id:
        request_id = str(uuid.uuid4())
    
    request_id_var.set(request_id)
    return request_id


# Export logger instance for easy import
logger = logging.getLogger("bibliomind")
