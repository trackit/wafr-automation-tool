import { useState } from 'react';
import { Tabs, VerticalMenu } from '@webui/ui';

export function AssessmentDetails() {
  const [activeQuestion, setActiveQuestion] = useState<string>('id1');
  const devMenuQuestions = [
    // Operational Excellence
    {
      text: 'How do you determine what your priorities are?',
      id: 'id1',
      active: activeQuestion === 'id1',
      onClick: () => setActiveQuestion('id1'),
    },
    {
      text: 'How do you structure your organization to support your business outcomes?',
      id: 'id2',
      active: activeQuestion === 'id2',
      onClick: () => setActiveQuestion('id2'),
    },
    {
      text: 'How do you design your workloads so that they can evolve over time?',
      id: 'id3',
      active: activeQuestion === 'id3',
      onClick: () => setActiveQuestion('id3'),
    },
    {
      text: 'How do you implement new features safely?',
      id: 'id4',
      active: activeQuestion === 'id4',
      onClick: () => setActiveQuestion('id4'),
    },
    {
      text: 'How do you evolve your workload while minimizing potential impacts?',
      id: 'id5',
      active: activeQuestion === 'id5',
      onClick: () => setActiveQuestion('id5'),
    },
    // Security
    {
      text: 'How do you securely administer your workload?',
      id: 'id6',
      active: activeQuestion === 'id6',
      onClick: () => setActiveQuestion('id6'),
    },
    {
      text: 'How do you control human access to the AWS resources?',
      id: 'id7',
      active: activeQuestion === 'id7',
      onClick: () => setActiveQuestion('id7'),
    },
    {
      text: 'How do you manage secrets for your workload?',
      id: 'id8',
      active: activeQuestion === 'id8',
      onClick: () => setActiveQuestion('id8'),
    },
    {
      text: 'How do you implement network security?',
      id: 'id9',
      active: activeQuestion === 'id9',
      onClick: () => setActiveQuestion('id9'),
    },
    {
      text: 'How do you protect your data at rest?',
      id: 'id10',
      active: activeQuestion === 'id10',
      onClick: () => setActiveQuestion('id10'),
    },
    // Reliability
    {
      text: 'How do you manage service quotas and constraints?',
      id: 'id11',
      active: activeQuestion === 'id11',
      onClick: () => setActiveQuestion('id11'),
    },
    {
      text: 'How do you plan your network topology?',
      id: 'id12',
      active: activeQuestion === 'id12',
      onClick: () => setActiveQuestion('id12'),
    },
    {
      text: 'How do you design your workload to adapt to changes in demand?',
      id: 'id13',
      active: activeQuestion === 'id13',
      onClick: () => setActiveQuestion('id13'),
    },
    {
      text: 'How do you implement change?',
      id: 'id14',
      active: activeQuestion === 'id14',
      onClick: () => setActiveQuestion('id14'),
    },
    {
      text: 'How do you monitor workload resources?',
      id: 'id15',
      active: activeQuestion === 'id15',
      onClick: () => setActiveQuestion('id15'),
    },
    // Cost Optimization
    {
      text: 'How do you implement cloud financial management?',
      id: 'id16',
      active: activeQuestion === 'id16',
      onClick: () => setActiveQuestion('id16'),
    },
    {
      text: 'How do you evaluate cost when you select services?',
      id: 'id17',
      active: activeQuestion === 'id17',
      onClick: () => setActiveQuestion('id17'),
    },
    {
      text: 'How do you meet cost targets when you select resource type, size, and number?',
      id: 'id18',
      active: activeQuestion === 'id18',
      onClick: () => setActiveQuestion('id18'),
    },
    {
      text: 'How do you use pricing models to reduce cost?',
      id: 'id19',
      active: activeQuestion === 'id19',
      onClick: () => setActiveQuestion('id19'),
    },
    {
      text: 'How do you plan for data transfer charges?',
      id: 'id20',
      active: activeQuestion === 'id20',
      onClick: () => setActiveQuestion('id20'),
    },
    // Performance Efficiency
    {
      text: 'How do you select the best performing architecture?',
      id: 'id21',
      active: activeQuestion === 'id21',
      onClick: () => setActiveQuestion('id21'),
    },
    {
      text: 'How do you select your compute solution?',
      id: 'id22',
      active: activeQuestion === 'id22',
      onClick: () => setActiveQuestion('id22'),
    },
    {
      text: 'How do you configure your networking solution?',
      id: 'id23',
      active: activeQuestion === 'id23',
      onClick: () => setActiveQuestion('id23'),
    },
    {
      text: 'How do you select your storage solution?',
      id: 'id24',
      active: activeQuestion === 'id24',
      onClick: () => setActiveQuestion('id24'),
    },
    {
      text: 'How do you monitor your resources to ensure they are performing?',
      id: 'id25',
      active: activeQuestion === 'id25',
      onClick: () => setActiveQuestion('id25'),
    },
  ];

  return (
    <div className="container py-8 overflow-auto flex-1 flex flex-col">
      <div className="prose mb-4">
        <h2 className="mt-0">Assessment 01 - Client</h2>
      </div>
      <Tabs
        tabs={[
          { label: 'Operational Excellence 0/5', id: 'tab1' },
          { label: 'Security 0/5', id: 'tab2' },
          { label: 'Reliability 0/5', id: 'tab3' },
          { label: 'Cost Optimization 0/5', id: 'tab4' },
          { label: 'Performance Efficiency 0/5', id: 'tab5' },
        ]}
        activeTab="tab1"
        onChange={(tab) => {
          console.log(tab);
        }}
      />
      <div className="flex-1 flex flex-row overflow-auto  my-4 rounded-lg border border-neutral-content shadow-md ">
        <VerticalMenu items={devMenuQuestions} />
        <div className="flex-1 bg-primary/5 "></div>
      </div>
    </div>
  );
}

export default AssessmentDetails;
