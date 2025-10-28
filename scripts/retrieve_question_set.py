import datetime
import json
import logging
import re
import time
from pathlib import Path
from typing import TypedDict

import boto3
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.ui import WebDriverWait
from types_boto3_wellarchitected.type_defs import (
    AnswerSummaryTypeDef,
    ChoiceTypeDef,
    PillarReviewSummaryTypeDef,
    WorkloadSummaryTypeDef,
)

logger = logging.getLogger("ExportWellArchitectedTool")
logger.setLevel(logging.DEBUG)

WORKLOAD_NAME = f"wafr-retrieve-questionset-{time.time()}"
WAFR_LENS = "wellarchitected"


class BestPractice(TypedDict):
    primary_id: str
    label: str
    description: str
    risk: str


class Question(TypedDict):
    primary_id: str
    label: str
    best_practices: dict[str, BestPractice]


class Pillar(TypedDict):
    primary_id: str
    label: str
    questions: dict[str, Question]


chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")


class RetrieveQuestionSet:
    def __init__(self) -> None:
        self.well_architect_client = boto3.client("wellarchitected")
        self.workload_name = f"wafr-retrieve-questionset-{time.time()}"
        self.question_set: dict[str, Pillar] = {}
        self.driver = self.create_chrome_driver()

    def create_chrome_driver(self) -> WebDriver:
        driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=chrome_options)
        driver.maximize_window()
        return driver

    def does_workload_exist(self, workload_name: str) -> WorkloadSummaryTypeDef | None:
        workloads = self.well_architect_client.list_workloads()["WorkloadSummaries"]
        return next((workload for workload in workloads if workload.get("WorkloadName") == workload_name), None)

    def create_workload(self) -> str:
        workload = self.does_workload_exist(self.workload_name)
        if workload is not None:
            workload_id = workload.get("WorkloadId")
            if workload_id is not None:
                return workload_id
        workload = self.well_architect_client.create_workload(
            WorkloadName=self.workload_name,
            Description="WAFR for retrieving questionset",
            Environment="PRODUCTION",
            Lenses=[WAFR_LENS],
            AwsRegions=["us-west-2"],
            ClientRequestToken=WORKLOAD_NAME,
            ReviewOwner="WAFR Automation Tool",
            Tags={
                "Owner": "WAFR Automation Tool",
                "Project": "WAFR Automation Tool",
                "Name": "Retrieve Question Set",
            },
        )
        return workload.get("WorkloadId")

    def delete_workload(self, workload_id: str) -> None:
        self.well_architect_client.delete_workload(WorkloadId=workload_id, ClientRequestToken=WORKLOAD_NAME)

    def retrieve_best_practice_risk(self, best_practice: ChoiceTypeDef) -> str:
        self.driver.get(
            f"https://docs.aws.amazon.com/wellarchitected/latest/framework/{best_practice.get('ChoiceId')}.html"
        )
        if (
            self.driver.current_url
            != f"https://docs.aws.amazon.com/wellarchitected/latest/framework/{best_practice.get('ChoiceId')}.html"
        ):
            logger.error("Best practice %s not found", best_practice.get("ChoiceId"))
            logger.error(
                "Try to search the best practice on the site: https://docs.aws.amazon.com/wellarchitected/latest/framework/appendix.html"
            )
            risk = "N/A"
            while risk == "N/A":
                risk = input("Enter the risk of the best practice (High, Medium, Low): ")
                if risk not in ["High", "Medium", "Low"]:
                    logger.error("Invalid risk")
                    risk = "N/A"
                else:
                    logger.info("Risk found: %s", risk)
                    break
            return risk
        page_content = WebDriverWait(self.driver, 5).until(
            ec.presence_of_element_located((By.XPATH, "//*[@id='main-col-body']"))
        )
        paragraphs = page_content.find_elements(By.TAG_NAME, "p")
        for text in paragraphs:
            content = text.text
            if "Level of risk" in content:
                return re.findall(r"(High|Medium|Low)", content)[0]
        error_message = "Best practice risk not found"
        raise AssertionError(error_message)

    def retrieve_best_practice(self, question_choices: list[ChoiceTypeDef]) -> dict[str, BestPractice]:
        best_practices: dict[str, BestPractice] = {}
        for best_practice_index, best_practice in enumerate(question_choices):
            best_practice_id = best_practice.get("ChoiceId")
            best_practice_title = best_practice.get("Title")
            best_practice_description = best_practice.get("Description", "")
            if not best_practice_id or not best_practice_title:
                logger.error("Missing fields for best practice %s", best_practice_title)
                continue
            if "None of these" in best_practice_title:
                continue
            best_practices[str(best_practice_index)] = BestPractice(
                primary_id=best_practice_id,
                label=best_practice_title,
                description=best_practice_description,
                risk=self.retrieve_best_practice_risk(best_practice),
            )
        return best_practices

    def retrieve_questions(self, pillar_answers: list[AnswerSummaryTypeDef]) -> dict[str, Question]:
        questions: dict[str, Question] = {}
        for question_index, question in enumerate(pillar_answers):
            question_id = question.get("QuestionId")
            question_title = question.get("QuestionTitle")
            question_choices = question.get("Choices")
            if not question_id or not question_title or not question_choices:
                logger.error("Missing fields for question %s", question_title)
                continue
            questions[str(question_index)] = Question(
                primary_id=question_id,
                label=question_title,
                best_practices=self.retrieve_best_practice(question_choices),
            )
        return questions

    def retrieve_pillars(self, workload_id: str, pillar_reviews: list[PillarReviewSummaryTypeDef]) -> None:
        for pillar_index, pillar in enumerate(pillar_reviews):
            pillar_id = pillar.get("PillarId")
            pillar_name = pillar.get("PillarName")
            if not pillar_name or not pillar_id:
                logger.error("Missing fields for pillar %s", pillar_name)
                continue
            pillar_answers = self.well_architect_client.list_answers(
                WorkloadId=workload_id, LensAlias=WAFR_LENS, PillarId=pillar_id, MaxResults=50
            ).get("AnswerSummaries", [])
            self.question_set[str(pillar_index)] = Pillar(
                primary_id=pillar_id,
                label=pillar_name,
                questions=self.retrieve_questions(pillar_answers),
            )

    def save_question_set(self) -> None:
        current_date = datetime.datetime.now(tz=datetime.UTC).strftime("%m%d%Y")
        with Path(f"questions/questions_{current_date}.json").open("w") as f:
            f.write(json.dumps(self.question_set, indent=4))

    def execute(self) -> None:
        workload_id = self.create_workload()
        lens_review = self.well_architect_client.get_lens_review(WorkloadId=workload_id, LensAlias=WAFR_LENS)[
            "LensReview"
        ]
        pillar_reviews = lens_review.get("PillarReviewSummaries", [])
        self.retrieve_pillars(workload_id, pillar_reviews)
        self.delete_workload(workload_id)
        self.save_question_set()


def main() -> None:
    retrieve_question_set = RetrieveQuestionSet()
    retrieve_question_set.execute()


if __name__ == "__main__":
    main()
