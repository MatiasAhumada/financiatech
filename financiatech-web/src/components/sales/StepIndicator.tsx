interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  deviceProgress?: {
    linked: number;
    total: number;
  };
}

export function StepIndicator({
  currentStep,
  steps,
  deviceProgress,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-8 mb-6">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex items-center gap-8">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  isActive || isCompleted
                    ? "bg-mahogany_red text-white"
                    : "bg-carbon_black-600 text-silver-400"
                }`}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>
              <p
                className={`text-xs mt-2 uppercase ${
                  isActive
                    ? "text-mahogany_red"
                    : isCompleted
                      ? "text-white"
                      : "text-silver-400"
                }`}
              >
                {label}
              </p>
              {stepNumber === 3 && deviceProgress && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-carbon_black-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-300"
                        style={{
                          width: `${(deviceProgress.linked / deviceProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-silver-400">
                      {deviceProgress.linked}/{deviceProgress.total}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {stepNumber < steps.length && (
              <div
                className={`w-24 h-0.5 ${
                  stepNumber < currentStep
                    ? "bg-mahogany_red"
                    : "bg-carbon_black-600"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
