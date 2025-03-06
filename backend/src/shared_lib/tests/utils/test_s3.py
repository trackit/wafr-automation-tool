def test_parse_s3_uri():
    from utils.s3 import parse_s3_uri

    assert parse_s3_uri("s3://bucket/key") == ("bucket", "key")
    assert parse_s3_uri("s3://bucket/key/subkey") == ("bucket", "key/subkey")


def test_get_s3_uri():
    from utils.s3 import get_s3_uri

    assert get_s3_uri("bucket", "key") == "s3://bucket/key"
    assert get_s3_uri("bucket", "key/subkey") == "s3://bucket/key/subkey"
