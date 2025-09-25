import { useId } from 'react';

import { FAQItem } from './faq';

type FAQCollapseProps = {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
};

export function FAQCollapse({ item, isOpen, onToggle }: FAQCollapseProps) {
  const contentId = useId();
  const { question, answer } = item;

  return (
    <div
      className={`collapse bg-base-100 border-base-300 border collapse-arrow ${
        isOpen ? 'collapse-open' : 'collapse-close'
      }`}
    >
      <button
        type="button"
        className="collapse-title font-semibold text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span dangerouslySetInnerHTML={{ __html: question }} />
      </button>
      <div id={contentId} className="collapse-content text-sm h-auto">
        {answer}
      </div>
    </div>
  );
}

export default FAQCollapse;
