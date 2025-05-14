import { FAQItem } from './faq';

export function FAQCollapse(faq: FAQItem) {
  return (
    <div className="collapse bg-base-100 border-base-300 border collapse-arrow">
      <input type="radio" name="faq-collapse" />
      <div
        className="collapse-title font-semibold"
        dangerouslySetInnerHTML={{ __html: faq.question }}
      />
      <div className="collapse-content text-sm h-auto">{faq.answer}</div>
    </div>
  );
}

export default FAQCollapse;
