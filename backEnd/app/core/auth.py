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
from app.core.config import get_settings
import jwt
import logging

# Setup logger
logger = logging.getLogger(__name__)    

# FastAPI security scheme – tự động đọc Bearer token từ Header
bearer_scheme = HTTPBearer(auto_error=False)


# ...
async def _verify_supabase_token(token: str) -> dict:
    """
    Xác minh token bằng JWKS (JSON Web Key Set) public key từ Supabase.
    PyJWKClient sẽ tự động fetch và cache Public Key, đảm bảo an toàn tuyệt đối
    và đạt tốc độ xác minh cực nhanh từ request thứ 2 trở đi.
    """
    settings = get_settings()
    # URL lấy JWKS của Supabase
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    # Supabase dùng Kong API Gateway đứng trước mọi endpoint /auth/v1/*,
    # Kong yêu cầu header 'apikey' để định tuyến request — tách biệt hoàn
    # toàn với việc xác thực JWT của user. Thiếu header này, Kong tự chặn
    # bằng 401 trước khi request chạm tới Auth service thật sự bên trong.
    jwks_client = jwt.PyJWKClient(
        jwks_url,
        headers={"apikey": settings.SUPABASE_ANON_KEY},
    )

    try:
        # Tự động lấy public key phù hợp (dựa vào 'kid' trong header của token)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Giải mã và xác thực token cục bộ bằng Public Key (RS256)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],  # Hỗ trợ cả 2 để tương thích ngược nếu cần
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": "Token đã hết hạn. Vui lòng đăng nhập lại.",
                "error_code": "TOKEN_EXPIRED",
            },
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": f"Token không hợp lệ: {str(e)}",
                "error_code": "INVALID_TOKEN",
            },
        )
    except jwt.PyJWKClientError as e:
        # Lỗi khi lấy JWKS public key từ Supabase: sai SUPABASE_URL, mất mạng,
        # Supabase đang bảo trì/timeout... KHÔNG phải lỗi do token sai.
        logger.error("Không thể lấy JWKS từ Supabase (%s): %s", jwks_url, str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "error",
                "message": "Không thể xác thực lúc này. Vui lòng thử lại sau ít phút.",
                "error_code": "AUTH_SERVICE_UNAVAILABLE",
            },
        )
    except Exception as e:
        # Safety net cuối cùng: bất kỳ lỗi nào khác chưa lường trước (network,
        # parsing, v.v.) đều PHẢI biến thành HTTPException, không được để lọt
        # ra ngoài thành 500 trần trụi (mất CORS header, khó debug từ FE).
        logger.error("Lỗi xác thực không xác định: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "status": "error",
                "message": "Không thể xác thực token.",
                "error_code": "AUTH_VERIFICATION_FAILED",
            },
        )

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
    return user_data.get("sub")  # Supabase user UUID nằm ở field 'sub'


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
        return user_data.get("sub")
    except HTTPException:
        return None
