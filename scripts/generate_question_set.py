import json
import re
from datetime import datetime
from typing import TypedDict

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

chrome_options = Options()
chrome_options.add_argument("--headless")  # type: ignore
chrome_options.add_argument("--no-sandbox")  # type: ignore
chrome_options.add_argument("--disable-dev-shm-usage")  # type: ignore

service = Service("/usr/bin/chromedriver")
driver = webdriver.Chrome(service=service, options=chrome_options)
driver.get(
    "https://docs.aws.amazon.com/wellarchitected/latest/framework/general-design-principles.html"
)
driver.maximize_window()


def get_text_from_li(li: WebElement):
    return li.find_element(By.XPATH, ".//a/span").get_attribute("textContent").strip()  # type: ignore


def get_formatted_text_question(question: WebElement):
    text = get_text_from_li(question)
    return re.sub(r"^[A-Z]+\s\d+\.?\s*", "", text)


def get_formatted_text_statement(statement: WebElement):
    text = get_text_from_li(statement)
    return re.sub(r"^[A-Z]+\d+-[A-Z]+\d+:?\s*", "", text)


class BestPracticeData(TypedDict):
    risk: str
    description: str


def get_best_practice_data(best_practice: WebElement) -> BestPracticeData:
    best_practice_data: BestPracticeData = {"risk": "", "description": ""}
    link_element = best_practice.find_element(By.XPATH, ".//a")  # type: ignore
    url = link_element.get_attribute("href")  # type: ignore
    driver.execute_script(f"window.open('{url}', '_blank');")  # type: ignore
    driver.switch_to.window(driver.window_handles[1])
    page_content = WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//*[@id='main-col-body']"))
    )
    paragraphs = page_content.find_elements(By.TAG_NAME, "p")  # type: ignore
    if len(paragraphs) != 0:
        best_practice_data["description"] = paragraphs[0].text
    for text in paragraphs:
        content = text.text
        if "Level of risk" in content:
            driver.close()
            driver.switch_to.window(driver.window_handles[0])
            best_practice_data["risk"] = re.findall(r"(High|Medium|Low)", content)[0]
            break
    driver.switch_to.window(driver.window_handles[0])
    return best_practice_data


try:
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                "/html/body/div[2]/div/div/div[3]/main/div[2]/nav[2]/div/div[2]/div[2]/div/ul/li[8]/div/div[2]/ul",
            )
        )
    )
    json_output = {}
    pillars = element.find_elements(By.XPATH, "./li")  # type: ignore
    for pillar in pillars:
        pillar_text = get_text_from_li(pillar)
        json_output[pillar_text] = {}
        categories = pillar.find_elements(By.XPATH, "./div/div[2]/ul/li")  # type: ignore
        for category in categories:
            questions = category.find_elements(By.XPATH, "./div/div[2]/ul/li")  # type: ignore
            for question in questions:
                question_text = get_formatted_text_question(question)
                json_output[pillar_text][question_text] = {}
                best_practices = question.find_elements(By.XPATH, "./div/div[2]/ul/li")  # type: ignore
                for best_practice in best_practices:
                    best_practice_text = get_formatted_text_statement(best_practice)
                    json_output[pillar_text][question_text][best_practice_text] = (
                        get_best_practice_data(best_practice)
                    )
    current_date = datetime.now().strftime("%m%d%Y")
    with open(f"questions/questions_{current_date}.json", "w") as f:
        f.write(json.dumps(json_output, indent=4))

except Exception as e:
    print(e)
driver.quit()
