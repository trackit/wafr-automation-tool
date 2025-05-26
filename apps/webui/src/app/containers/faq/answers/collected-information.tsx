const CollectedInformationAnswer = () => (
  <div className="space-y-6">
    <p>
      WAFR Automation Tool collects information related to your AWS environment
      during the assessment, such as configuration settings, security policies,
      and performance metrics. It’s important to note that at the end of the
      scan of an assessment, only the findings are retained.
    </p>
    <p>
      All sensitive account data is discarded, and in the event of deletion, all
      stored findings are completely removed.
    </p>
  </div>
);

export default CollectedInformationAnswer;
