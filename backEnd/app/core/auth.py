"""
Xác thực Supabase JWT Token.

Luồng:
  1. Frontend gửi Header: Authorization: Bearer <token>
  2. Backend gọi Supabase /auth/v1/user với token đó để xác minh.
  3. Nếu hợp lệ → trả về user_id (UUID string).
  4. Nếu không hợp lệ → raise HTTP 401.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx

from app.core.config import get_settings

# FastAPI security scheme – tự động đọc Bearer token từ Header
bearer_scheme = HTTPBearer(auto_error=False)


async def _verify_supabase_token(token: str) -> dict:
    """
    Gọi Supabase REST API để xác minh token và lấy thông tin user.
    Trả về dict user info từ Supabase.
    """
    settings = get_settings()
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.SUPABASE_ANON_KEY,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": "Token không hợp lệ hoặc đã hết hạn",
                "error_code": "INVALID_TOKEN",
            },
        )
    return response.json()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Dependency bắt buộc [Auth]:
    Xác minh token và trả về user_id (str UUID).
    Sử dụng trong các endpoint yêu cầu đăng nhập.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": "Vui lòng đăng nhập để sử dụng tính năng này",
                "error_code": "UNAUTHORIZED",
            },
        )
    user_data = await _verify_supabase_token(credentials.credentials)
    return user_data["id"]  # Supabase user UUID


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[str]:
    """
    Dependency tùy chọn (Public endpoint):
    Trả về user_id nếu có token hợp lệ, None nếu không có token.
    Dùng cho endpoint Public nhưng có xử lý khác nhau cho Guest vs Member.
    """
    if credentials is None:
        return None
    try:
        user_data = await _verify_supabase_token(credentials.credentials)
        return user_data["id"]
    except HTTPException:
        return None
