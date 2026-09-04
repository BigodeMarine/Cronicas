from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt
from app.core.config import settings

# Cria o gerenciador responsável por gerar e verificar hashes.
password_hash = PasswordHash.recommended()

"""
Gera um hash seguro para a senha informada.
"""
def hash_password(password: str) -> str:
    
    return password_hash.hash(password)

"""
Verifica se uma senha corresponde ao hash armazenado.
"""
def verify_password(password: str, hashed_password: str) -> bool:
    
    return password_hash.verify(password, hashed_password)

"""
Cria um token JWT de acesso para o usuário, o token contém o ID do usuário e uma data de expiração.
"""
def create_access_token(user_id: int) -> str:

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

"""
Decodifica e valida um token JWT, retorna o ID do usuário contido no token.
"""
def decode_access_token(token: str) -> int:

    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    return int(payload["sub"])
