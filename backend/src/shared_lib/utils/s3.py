from urllib.parse import urlparse


def parse_s3_uri(s3_uri: str) -> tuple[str, str]:
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    return bucket, key


def get_s3_uri(bucket: str, key: str) -> str:
    return f"s3://{bucket}/{key}"
