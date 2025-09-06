export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-lg font-bold">✓</span>
        </div>
        <h3 className="text-xl font-semibold m-0">Thanks for purchasing!</h3>
      </div>

      <p className="m-0 text-base-content/80">
        To enable automated management (<b>StackSets</b> updates), please deploy
        the authorization stack in <b>your AWS account</b>. It only takes a
        minute.
      </p>

      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default WelcomeStep;
