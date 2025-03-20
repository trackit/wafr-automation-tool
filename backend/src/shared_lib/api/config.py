import os

DEFAULT_ASSESSMENT_ROLE = os.getenv("DEFAULT_ASSESSMENT_ROLE", "test-role")

API_URL = "https://{}.execute-api.{}.amazonaws.com/{}/{}"
