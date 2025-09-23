export default function MilestonesAnswer() {
  return (
    <div className="space-y-6">
      <p>
        <b>Milestones</b> are a way to track and measure progress over time as
        you assess and improve your AWS environment.
      </p>
      They are <b>saved states (snapshots)</b> of a review at a given point in
      time in the AWS Well-Architected Tool.
      <br />
      They let you capture the answers, risks, and improvements identified
      during a review so you can come back later and compare how the assessment
      evolves.
      <br />
      Essentially, they are checkpoints you can reference to see if your
      assessment is improving according to AWS best practices.
      <br />
      <div className="space-y-4 mt-4">
        <p>Typical use of milestones includes:</p>
        <ol className="list-decimal list-inside">
          <li>
            <b>Initial assessment</b> → Capture the baseline state of your
            workload.
          </li>
          <li>
            <b>After remediation</b> → Record improvements after addressing
            high/medium risks.
          </li>
          <li>
            <b>Operational checkpoints</b> → Capture state after major product
            launches, migrations, or architecture changes.
          </li>
        </ol>
      </div>
      <p>
        To start creating milestones you first need to export an assessment to
        the <b>AWS Well-Architected Tool</b> using a specific AWS region.
      </p>
      <p>When you create a milestone:</p>
      <ul className="list-disc list-inside">
        <li>The current state of your assessment is captured.</li>
        <li>
          The assessment is exported to the <b>AWS Well-Architected Tool</b> in
          the previously specified region during the assessment export.
        </li>
        <li>
          The milestone is created and attached to the exported assessment.
        </li>
      </ul>
    </div>
  );
}
