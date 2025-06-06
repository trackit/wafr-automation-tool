const HowDoesWAFRAutomationWorkAnswer = () => (
  <div className="flex space-x-2">
    <div className="w-4/5 space-y-2">
      <div>
        <p>
          WAFR Automation is built on a serverless architecture using AWS
          services like Lambda, API Gateway, and ECS Fargate. It automates the
          process of assessing your AWS environment by running security and
          compliance checks with tools like Prowler.
        </p>
        <p>
          The findings are mapped to AWS best practices and presented on an
          interactive dashboard. The tool scales automatically, ensuring
          efficiency and providing actionable insights that can be tracked and
          implemented with ease.
        </p>
      </div>
      <img
        alt="AWS Architecture"
        src="/assets/architecture.png"
        className="w-full h-auto object-contain"
      />
    </div>
    <div className="border-l border-gray-300 pl-4">
      <h3 className="text-2xl font-semibold text-gray-800">Architecture</h3>
      <p className="mt-2 text-lg text-gray-700">
        The WAFR Automation Tool uses a serverless architecture built on AWS
        services:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
        <li>
          <strong>AWS Serverless Application Model (SAM):</strong> Built using
          AWS SAM for efficient management of serverless applications.
        </li>
        <li>
          <strong>Serverless Functions:</strong> Runs as a collection of
          serverless functions that automatically assess AWS accounts.
        </li>
        <li>
          <strong>Automated Checks:</strong> Performs automated checks against
          Well-Architected Framework principles.
        </li>
        <li>
          <strong>Scalability:</strong> Scales automatically based on demand,
          ensuring efficient use of resources.
        </li>
        <li>
          <strong>Cost Model:</strong> Operates with a pay-per-use cost model,
          ensuring cost efficiency.
        </li>
      </ul>
    </div>
  </div>
);

export default HowDoesWAFRAutomationWorkAnswer;
