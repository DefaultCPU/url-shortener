import secrets
import string

from sqlalchemy.orm import Session

from app import models

ALPHABET = string.ascii_letters + string.digits
CODE_LENGTH = 7


def generate_code() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))


def generate_unique_code(db: Session) -> str:
    while True:
        code = generate_code()
        exists = db.query(models.URL).filter(models.URL.code == code).first()
        if not exists:
            return code
