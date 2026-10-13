"""Armazenamento privado local, substituível por um adaptador de objetos."""
from io import BytesIO
import logging
import os
from pathlib import Path
import re
import tempfile
from typing import BinaryIO, Protocol
from uuid import uuid4
import warnings
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from pypdf.errors import PyPdfError
from sqlalchemy import event, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.character import CharacterFile

logger = logging.getLogger(__name__)


class PrivateFileStorage(Protocol):
    def write(self, data: bytes, extension: str) -> str: ...
    def open(self, key: str) -> BinaryIO: ...
    def delete(self, key: str) -> None: ...


class LocalFileStorage:
    def __init__(self, directory: Path):
        self.directory = directory.resolve()
        if any(part in ("public", ".next", "node_modules") for part in self.directory.parts):
            raise ValueError("O armazenamento deve ficar fora de diretórios públicos.")

    def _path(self, key: str) -> Path:
        # Nenhum caminho ou nome original enviado pelo cliente é utilizado aqui.
        if not re.fullmatch(r"[0-9a-f]{32}\.(png|jpg|pdf)", key):
            raise ValueError("Chave de armazenamento inválida.")
        path = self.directory / key
        if path.resolve().parent != self.directory:
            raise ValueError("Caminho de armazenamento inválido.")
        return path

    def write(self, data: bytes, extension: str) -> str:
        self.directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        key = f"{uuid4().hex}.{extension}"
        path = self._path(key)
        descriptor, temporary = tempfile.mkstemp(prefix=".pending-", dir=self.directory)
        try:
            with os.fdopen(descriptor, "wb") as output:
                output.write(data)
            os.replace(temporary, path)
        finally:
            Path(temporary).unlink(missing_ok=True)
        return key

    def open(self, key: str) -> BinaryIO:
        return self._path(key).open("rb")

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


def get_character_storage() -> PrivateFileStorage:
    try:
        return LocalFileStorage(settings.character_storage_dir)
    except ValueError:
        raise HTTPException(503, "Configure uma pasta privada para o armazenamento do cofre.")


def validate_upload(data: bytes, filename: str, declared_type: str | None, portrait: bool):
    """Valida conteúdo decodificável, não apenas o MIME ou a assinatura informados."""
    if not filename or len(filename) > 255 or any(c in filename for c in '/\\:') or any(ord(c) < 32 for c in filename):
        raise HTTPException(422, "Nome de arquivo inválido.")
    extension = Path(filename).suffix.lower()
    allowed = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    if not portrait:
        allowed[".pdf"] = "application/pdf"
    if extension not in allowed:
        raise HTTPException(422, "Use PNG/JPEG para retratos ou PDF/PNG/JPEG para fichas.")
    maximum = (5 if portrait else 10) * 1024 * 1024
    if not data:
        raise HTTPException(422, "O arquivo está vazio.")
    if len(data) > maximum:
        raise HTTPException(413, f"O limite é de {5 if portrait else 10} MB.")
    media_type = allowed[extension]
    if declared_type and declared_type not in (media_type, "application/octet-stream"):
        raise HTTPException(422, "O tipo informado não corresponde à extensão do arquivo.")
    try:
        if extension == ".pdf":
            if not data.startswith(b"%PDF-"):
                raise ValueError
            pdf = PdfReader(BytesIO(data), strict=True)
            if pdf.is_encrypted or not len(pdf.pages):
                raise ValueError
        else:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(BytesIO(data)) as image:
                    if image.format != ("PNG" if extension == ".png" else "JPEG") or image.width * image.height > 40_000_000:
                        raise ValueError
                    image.verify()
                with Image.open(BytesIO(data)) as image:
                    image.load()
    except (ValueError, OSError, SyntaxError, UnidentifiedImageError, Image.DecompressionBombWarning, Image.DecompressionBombError, PyPdfError, OverflowError, RecursionError):
        raise HTTPException(422, "Conteúdo inválido, imagem muito grande ou PDF protegido/corrompido.")
    return ("jpg" if extension == ".jpeg" else extension[1:]), media_type


@event.listens_for(Session, "before_flush")
def remember_deleted_files(session, *_):
    """Inclui cascatas de exclusão de campanha/personagem na limpeza dos arquivos."""
    keys = {obj.storage_key for obj in session.deleted if isinstance(obj, CharacterFile)}
    session.info.setdefault("vault_delete_keys", set()).update(keys)


@event.listens_for(Session, "after_commit")
def remove_committed_files(session):
    keys = session.info.pop("vault_delete_keys", set())
    session.info.pop("vault_new_keys", None)
    if not keys:
        return
    try:
        storage = session.info.get("vault_storage") or get_character_storage()
        # Só apaga blobs que não estão mais referenciados, inclusive após substituições.
        with session.get_bind().connect() as connection:
            referenced = set(connection.execute(select(CharacterFile.storage_key).where(CharacterFile.storage_key.in_(keys))).scalars())
        for key in keys - referenced:
            storage.delete(key)
    except Exception:
        # O banco já confirmou a operação: uma falha de limpeza não pode desfazer
        # esse resultado nem levar o serviço a apagar o novo arquivo referenciado.
        logger.exception("Falha ao limpar arquivo privado após commit; verificar armazenamento.")



@event.listens_for(Session, "after_rollback")
def discard_failed_uploads(session):
    session.info.pop("vault_delete_keys", None)
    keys = session.info.pop("vault_new_keys", set())
    if keys:
        storage = session.info.get("vault_storage") or get_character_storage()
        for key in keys:
            storage.delete(key)
