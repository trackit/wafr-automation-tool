import { CircleCheck, CircleMinus } from 'lucide-react';
import './timeline.css';

export type TimelineStep = {
  text: string;
  loading?: boolean;
  completed?: boolean;
};

export type TimelineProps = {
  steps: TimelineStep[];
};

export function Timeline({ steps }: TimelineProps) {
  return (
    <div className="timeline-container ">
      <ul className="timeline not-prose ">
        {steps.map((step, index) => (
          <li key={index}>
            {index > 0 && (
              <hr className={`${step.completed ? 'bg-primary' : ''}`} />
            )}
            <div className="timeline-middle">
              {step.completed && !step.loading && (
                <CircleCheck
                  className={`${step.completed ? 'text-primary' : ''}`}
                />
              )}
              {step.loading && (
                <div className="loading loading-ring loading-xl mt-1 text-primary"></div>
              )}
              {!step.completed && !step.loading && (
                <CircleMinus className="text-base-content/30" />
              )}
            </div>
            <div className="timeline-end timeline-box flex items-center border-none ">
              <span
                className={`text-lg ${
                  step.completed || step.loading
                    ? 'text-primary'
                    : 'text-base-content/50'
                }`}
              >
                {step.text}
              </span>
              {/* {step.loading && (
                <span className="loading loading-spinner loading-xs ml-2 text-primary"></span>
              )} */}
            </div>
            {index < steps.length - 1 && (
              <hr className={`${step.completed ? 'bg-primary' : ''}`} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Timeline;
