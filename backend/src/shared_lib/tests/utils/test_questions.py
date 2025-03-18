from unittest.mock import MagicMock, patch


@patch("os.listdir")
@patch("pathlib.Path.open")
def test_retrieve_questions(mock_open: MagicMock, mock_listdir: MagicMock):
    from utils.questions import retrieve_questions

    mock_listdir.return_value = ["questions_01312025.json"]
    mock_open.return_value.__enter__.return_value.read.return_value = """{
        "pillar-1": {
            "question-1": {
                "best-practice-1": {
                    "risk": "Low"
                },
                "best-practice-2": {
                    "risk": "Medium"
                }
            }
        },
        "pillar-2": {
            "question-2": {
                "best-practice-1": {
                    "risk": "High"
                }
            }
        }
    }"""

    output = retrieve_questions()

    assert output.version == "questions_01312025"
    assert output.data == {
        "pillar-1": {
            "question-1": {
                "best-practice-1": {
                    "data": {"risk": "Low", "status": False},
                    "results": [],
                },
                "best-practice-2": {
                    "data": {"risk": "Medium", "status": False},
                    "results": [],
                },
            }
        },
        "pillar-2": {
            "question-2": {
                "best-practice-1": {
                    "data": {"risk": "High", "status": False},
                    "results": [],
                },
            }
        },
    }
