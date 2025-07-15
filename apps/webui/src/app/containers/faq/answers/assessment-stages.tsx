const AssessmentStagesAnswer = () => (
  <div className="space-y-6">
    <p>The assessment process follows a sequence of stages:</p>
    <ul className="list-decimal pl-6 text-gray-700 space-y-2">
      <li>
        <strong>SCANNING:</strong> This is the initial stage where the system
        begins scanning your environment to gather the necessary data for the
        assessment. It the one who take the most time to complete.
      </li>
      <li>
        <strong>PREPARING_ASSOCIATIONS:</strong> In this stage, the tool
        prepares prompts based on the data collected to initiate the review
        process and trigger the next steps in the analysis.
      </li>
      <li>
        <strong>ASSOCIATING_FINDINGS:</strong> At this stage, the large language
        model (LLM) is invoked to process the gathered data and map the findings
        against AWS best practices.
      </li>
      <li>
        <strong>FINISHED:</strong> The final stage where the assessment is
        complete. Findings are displayed in an interactive dashboard, providing
        actionable insights and recommendations for improvement.
      </li>
    </ul>
  </div>
);

export default AssessmentStagesAnswer;
