import { Home, Search } from 'lucide-react';
import { JSX, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { useNavigate } from 'react-router';

import AssessmentStagesAnswer from './answers/assessment-stages';
import AssessmentTimeAnswer from './answers/assessment-time';
import BestPracticesAnswer from './answers/best-practice';
import CollectedInformationAnswer from './answers/collected-information';
import ExportRoleAnswer from './answers/export-role';
import HowDoesWAFRAutomationWorkAnswer from './answers/how-does-wafr-automation-tool-work';
import MilestonesAnswer from './answers/milestones-answer';
import PrimaryGoalAnswer from './answers/primary-goal';
import ReportBugAnswer from './answers/report-bug';
import RescanAssessmentAnswer from './answers/rescan-assessment';
import ScanRoleAnswer from './answers/scan-role';
import ShareAssessmentAnswer from './answers/share-assessment';
import WhatIsWAFRAutomationToolAnswer from './answers/what-is-wafr-automation-tool';
import FAQCollapse from './faq-collapse';

export type FAQItem = {
  question: string;
  answer: JSX.Element;
};

function highlightText(text: string, search: string) {
  if (!search.trim()) return text;
  try {
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    return text.replace(regex, '<mark>$1</mark>');
  } catch {
    return text;
  }
}

export function FAQ() {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>('');

  const faqs: FAQItem[] = [
    {
      question: 'What is WAFR Automation Tool?',
      answer: <WhatIsWAFRAutomationToolAnswer />,
    },
    {
      question: 'How does WAFR Automation work?',
      answer: <HowDoesWAFRAutomationWorkAnswer />,
    },
    {
      question: 'How do you create a scan role?',
      answer: <ScanRoleAnswer />,
    },
    {
      question: 'How do you create an export role?',
      answer: <ExportRoleAnswer />,
    },
    {
      question: 'How long does an assessment last?',
      answer: <AssessmentTimeAnswer />,
    },
    {
      question: 'What do the different stages of an assessment correspond to?',
      answer: <AssessmentStagesAnswer />,
    },
    {
      question: 'Where do best practices come from?',
      answer: <BestPracticesAnswer />,
    },
    {
      question: 'How does the rescan of an assessment work?',
      answer: <RescanAssessmentAnswer />,
    },
    // {
    //   question: 'Where can I find the source code for WAFR Automation?',
    //   answer: <SourceCodeAnswer />,
    // },
    // {
    //   question: 'Can I contribute to the open-source project?',
    //   answer: <ContributeProjectAnswer />,
    // },
    {
      question: 'Where can I report a bug?',
      answer: <ReportBugAnswer />,
    },
    {
      question: 'What is the primary goal of the tool?',
      answer: <PrimaryGoalAnswer />,
    },
    {
      question: 'How can I share my assessment?',
      answer: <ShareAssessmentAnswer />,
    },
    {
      question: 'What information is collected during an assessment?',
      answer: <CollectedInformationAnswer />,
    },
    {
      question: 'How do Milestones work?',
      answer: <MilestonesAnswer />,
    },
  ];

  return (
    <div className="container h-full flex flex-col py-8 px-4 gap-4">
      <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
        <h2 className="mt-0 mb-0">FAQ</h2>
        <button
          className="btn btn-primary btn-sm text-sm h-8 min-h-8"
          onClick={(e) => {
            navigate('/');
          }}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </div>
      <div className="flex flex-row gap-4">
        <label className="input w-full">
          <Search className="w-4 h-4" />
          <input
            type="search"
            className="grow"
            placeholder="What are you looking for?"
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
          />
        </label>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-2">
          {faqs
            .filter((faq) => {
              const questionLower = faq.question.toLowerCase();
              const answerLower = renderToString(faq.answer).toLowerCase();
              return (
                questionLower.includes(search) || answerLower.includes(search)
              );
            })
            .sort((a, b) => a.question.localeCompare(b.question))
            .map((faq) => ({
              ...faq,
              question: highlightText(faq.question, search),
              answer: (
                <div
                  dangerouslySetInnerHTML={{
                    __html: highlightText(renderToString(faq.answer), search),
                  }}
                />
              ),
            }))
            .map((faq) => (
              <FAQCollapse key={faq.question} {...faq} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
