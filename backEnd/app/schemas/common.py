"""
Response chuẩn cho toàn bộ API (theo API_Contract.md).

Quy tắc:
  - Mọi thành công → StandardSuccess (HTTP 200/201)
  - Mọi lỗi       → StandardError  (HTTP 400/401/403/500)
"""
from typing import Any, Optional
from pydantic import BaseModel


class StandardSuccess(BaseModel):
    """Response thành công chuẩn."""
    status: str = "success"
    message: str
    data: Any = None


class StandardError(BaseModel):
    """Response lỗi chuẩn."""
    status: str = "error"
    message: str
    error_code: str
