"""
Deprecation Middleware

Adds deprecation warnings to old workflow APIs
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from datetime import datetime


class DeprecationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add deprecation warnings to old APIs
    """
    
    # Define deprecated endpoints
    DEPRECATED_ENDPOINTS = {
        "/workflows": {
            "sunset_date": "2026-03-01",
            "replacement": "/situations/create",
            "message": "The workflow API is deprecated. Please use the situations API instead."
        },
        "/workflows/{instance_id}/status": {
            "sunset_date": "2026-03-01",
            "replacement": "/situations/{id}",
            "message": "Use /situations/{id} to get situation status."
        },
        "/workflows/{instance_id}/journey_map": {
            "sunset_date": "2026-03-01",
            "replacement": "/situations/{id}",
            "message": "Use /situations/{id} to get situation context and timeline."
        },
    }
    
    async def dispatch(self, request: Request, call_next):
        """
        Check if endpoint is deprecated and add warning headers
        """
        path = request.url.path
        
        # Check if path matches any deprecated endpoint
        deprecation_info = None
        for pattern, info in self.DEPRECATED_ENDPOINTS.items():
            if self._matches_pattern(path, pattern):
                deprecation_info = info
                break
        
        # Call the endpoint
        response = await call_next(request)
        
        # Add deprecation headers if applicable
        if deprecation_info:
            response.headers["Deprecation"] = "true"
            response.headers["Sunset"] = deprecation_info["sunset_date"]
            response.headers["Link"] = f'<{deprecation_info["replacement"]}>; rel="alternate"'
            response.headers["X-Deprecation-Message"] = deprecation_info["message"]
            
            # Log deprecation usage
            logger.warning(
                f"Deprecated API called: {path} by {request.client.host}. "
                f"Replacement: {deprecation_info['replacement']}"
            )
        
        return response
    
    def _matches_pattern(self, path: str, pattern: str) -> bool:
        """
        Check if path matches pattern (simple implementation)
        """
        # Handle exact matches
        if path == pattern:
            return True
        
        # Handle patterns with {param}
        pattern_parts = pattern.split("/")
        path_parts = path.split("/")
        
        if len(pattern_parts) != len(path_parts):
            return False
        
        for pp, pt in zip(pattern_parts, path_parts):
            if pp.startswith("{") and pp.endswith("}"):
                continue  # Parameter match
            if pp != pt:
                return False
        
        return True
