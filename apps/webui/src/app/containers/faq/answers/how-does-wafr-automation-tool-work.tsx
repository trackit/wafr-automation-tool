const HowDoesWAFRAutomationWorkAnswer = () => (
  <div className="flex space-x-2">
    <div className="w-4/5 space-y-2">
      <div>
        <p>
          WAFR Automation is a fully managed SaaS solution built on a serverless
          architecture using AWS services like Lambda, API Gateway, and ECS
          Fargate. It automates the process of assessing your AWS environment by
          running security and compliance checks with advanced tools like
          Prowler.
        </p>
        <p>
          The results are mapped to AWS best practices and are presented on an
          interactive, easy-to-use dashboard. WAFR Automation scales
          automatically to meet the demands of your environment, ensuring
          optimal performance and providing actionable insights that you can
          track, analyze, and implement seamlessly.
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
        The WAFR Automation Tool leverages a serverless architecture, hosted and
        managed on AWS services:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
        <li>
          <strong>AWS Serverless Application Model (SAM):</strong> Built using
          AWS SAM to ensure efficient management and deployment of serverless
          applications.
        </li>
        <li>
          <strong>Serverless Functions:</strong> Runs as a set of fully managed
          serverless functions, which automatically assess AWS accounts with no
          need for user intervention.
        </li>
        <li>
          <strong>Automated Checks:</strong> Performs automated checks against
          Well-Architected Framework principles to ensure your AWS environment
          meets best practices.
        </li>
        <li>
          <strong>Scalability:</strong> Automatically scales according to the
          size of your AWS environment, ensuring that resources are allocated as
          needed for optimal performance.
        </li>
        <li>
          <strong>Subscription-Based:</strong> WAFR Automation operates on a
          subscription model, providing you with continuous access to the tool
          and its updates, ensuring that your environment is always secure and
          compliant.
        </li>
      </ul>
    </div>
  </div>
);

export default HowDoesWAFRAutomationWorkAnswer;
