"""
Sentry monitoring and error tracking integration.

Provides production-grade error tracking and performance monitoring.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from app.core.config import settings
from app.core.logging import logger


def filter_sensitive_data(event, hint):
    """
    Filter sensitive data before sending to Sentry.
    
    Removes passwords, tokens, and other sensitive information.
    """
    # Remove sensitive headers
    if 'request' in event and 'headers' in event['request']:
        headers = event['request']['headers']
        sensitive_headers = ['Authorization', 'Cookie', 'X-Api-Key']
        for header in sensitive_headers:
            if header in headers:
                headers[header] = '[Filtered]'
    
    # Remove password fields from request data
    if 'request' in event and 'data' in event['request']:
        data = event['request']['data']
        if isinstance(data, dict):
            if 'password' in data:
                data['password'] = '[Filtered]'
            if 'password_hash' in data:
                data['password_hash'] = '[Filtered]'
    
    return event


def init_sentry():
    """
    Initialize Sentry error tracking.
    
    Only initializes if SENTRY_DSN is configured in settings.
    """
    if not settings.SENTRY_DSN:
        logger.info("Sentry DSN not configured, skipping initialization")
        return
    
    try:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            
            # Performance monitoring
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            profiles_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            
            # Integrations
            integrations=[
                FastApiIntegration(
                    transaction_style="endpoint",
                    failed_request_status_codes=[500, 501, 502, 503, 504, 505]
                ),
                SqlalchemyIntegration(),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                )
            ],
            
            # Security
            before_send=filter_sensitive_data,
            
            # Release tracking
            release=f"{settings.APP_NAME}@{settings.APP_VERSION}",
            
            # Additional options
            attach_stacktrace=True,
            send_default_pii=False,  # Don't send personally identifiable info
            max_breadcrumbs=50,
            
            # Ignored errors
            ignore_errors=[
                KeyboardInterrupt,
                SystemExit,
            ]
        )
        
        logger.info(
            f"Sentry initialized - Environment: {settings.SENTRY_ENVIRONMENT}, "
            f"Sampling: {settings.SENTRY_TRACES_SAMPLE_RATE * 100}%"
        )
        
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def capture_exception(error: Exception, context: dict = None):
    """
    Manually capture an exception to Sentry with additional context.
    
    Args:
        error: Exception to capture
        context: Additional context dictionary
    """
    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)


def set_user_context(user_id: str, email: str = None):
    """
    Set user context for Sentry error tracking.
    
    Args:
        user_id: User ID
        email: User email (optional)
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email
    })


def add_breadcrumb(message: str, category: str = "info", level: str = "info", data: dict = None):
    """
    Add breadcrumb for debugging context.
    
    Args:
        message: Breadcrumb message
        category: Category (e.g., 'auth', 'database', 'api')
        level: Log level (debug, info, warning, error)
        data: Additional data dictionary
    """
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data or {}
    )
