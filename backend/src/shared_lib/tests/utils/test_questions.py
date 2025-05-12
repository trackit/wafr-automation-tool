from unittest.mock import MagicMock, patch

from utils.questions import QuestionSetData, retrieve_questions


@patch("os.listdir")
@patch("pathlib.Path.open")
def test_format_questions(mock_open: MagicMock, mock_listdir: MagicMock):
    mock_listdir.return_value = ["questions_01312025.json"]
    mock_open.return_value.__enter__.return_value.read.return_value = """{
        "0": {
            "primary_id": "0",
            "label": "pillar-1",
            "questions": {
                "0": {
                    "primary_id": "0",
                    "label": "question-1",
                    "best_practices": {
                        "0": {
                            "primary_id": "0",
                            "label": "best-practice-1",
                            "description": "Best Practice 1 Description",
                            "risk": "Low"
                        },
                        "1": {
                            "primary_id": "1",
                            "label": "best-practice-2",
                            "description": "Best Practice 2 Description",
                            "risk": "Medium"
                        }
                    }
                }
            }
        },
        "1": {
            "primary_id": "1",
            "label": "pillar-2",
            "questions": {
                "0": {
                    "primary_id": "0",
                    "label": "question-2",
                    "best_practices": {
                        "0": {
                            "primary_id": "0",
                            "label": "best-practice-1",
                            "description": "Best Practice 1 Description",
                            "risk": "High"
                        }
                    }
                }
            }
        }
    }"""

    questions = retrieve_questions()

    assert questions.version == "questions_01312025"
    assert questions.data == QuestionSetData(
        **{
            "0": {
                "id": "0",
                "primary_id": "0",
                "label": "pillar-1",
                "disabled": False,
                "questions": {
                    "0": {
                        "id": "0",
                        "primary_id": "0",
                        "label": "question-1",
                        "none": False,
                        "disabled": False,
                        "best_practices": {
                            "0": {
                                "id": "0",
                                "primary_id": "0",
                                "label": "best-practice-1",
                                "description": "Best Practice 1 Description",
                                "risk": "Low",
                                "status": False,
                                "results": [],
                                "hidden_results": [],
                            },
                            "1": {
                                "id": "1",
                                "primary_id": "1",
                                "label": "best-practice-2",
                                "description": "Best Practice 2 Description",
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
                "primary_id": "1",
                "label": "pillar-2",
                "disabled": False,
                "questions": {
                    "0": {
                        "id": "0",
                        "primary_id": "0",
                        "label": "question-2",
                        "none": False,
                        "disabled": False,
                        "best_practices": {
                            "0": {
                                "id": "0",
                                "primary_id": "0",
                                "label": "best-practice-1",
                                "description": "Best Practice 1 Description",
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
    )
