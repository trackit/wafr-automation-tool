from unittest.mock import MagicMock, patch

from utils.questions import format_questions, retrieve_questions


@patch("os.listdir")
@patch("pathlib.Path.open")
def test_retrieve_questions(mock_open: MagicMock, mock_listdir: MagicMock):
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
                    "id": "best-practice-1",
                    "label": "best-practice-1",
                    "risk": "Low",
                    "status": False,
                    "results": [],
                    "hidden_results": [],
                },
                "best-practice-2": {
                    "id": "best-practice-2",
                    "label": "best-practice-2",
                    "risk": "Medium",
                    "status": False,
                    "results": [],
                    "hidden_results": [],
                },
            }
        },
        "pillar-2": {
            "question-2": {
                "best-practice-1": {
                    "id": "best-practice-1",
                    "label": "best-practice-1",
                    "risk": "High",
                    "status": False,
                    "results": [],
                    "hidden_results": [],
                },
            }
        },
    }


@patch("os.listdir")
@patch("pathlib.Path.open")
def test_format_questions(mock_open: MagicMock, mock_listdir: MagicMock):
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

    questions = retrieve_questions()
    output = format_questions(questions)

    assert output.version == "questions_01312025"
    assert output.data == {
        "0": {
            "id": "0",
            "label": "pillar-1",
            "disabled": False,
            "questions": {
                "0": {
                    "id": "0",
                    "label": "question-1",
                    "none": False,
                    "disabled": False,
                    "best_practices": {
                        "0": {
                            "id": "0",
                            "label": "best-practice-1",
                            "risk": "Low",
                            "status": False,
                            "results": [],
                            "hidden_results": [],
                        },
                        "1": {
                            "id": "1",
                            "label": "best-practice-2",
                            "risk": "Medium",
                            "status": False,
                            "results": [],
                            "hidden_results": [],
                        },
                    },
                }
            },
        },
        "1": {
            "id": "1",
            "label": "pillar-2",
            "disabled": False,
            "questions": {
                "0": {
                    "id": "0",
                    "label": "question-2",
                    "none": False,
                    "disabled": False,
                    "best_practices": {
                        "0": {
                            "id": "0",
                            "label": "best-practice-1",
                            "risk": "High",
                            "status": False,
                            "results": [],
                            "hidden_results": [],
                        },
                    },
                }
            },
        },
    }
