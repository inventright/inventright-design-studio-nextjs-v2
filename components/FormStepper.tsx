import { Check } from "lucide-react";

export interface Step {
  id: number;
  title: string;
  description: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export default function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  const getStepStatus = (stepId: number): "complete" | "current" | "upcoming" => {
    if (stepId < currentStep) return "complete";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full py-8">
      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isLast = index === steps.length - 1;
            const isClickable = status === "complete" && onStepClick;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    relative flex flex-col items-center group
                    ${isClickable ? "cursor-pointer" : "cursor-default"}
                  `}
                >
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      border-2 transition-all duration-200
                      ${
                        status === "complete"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : status === "current"
                          ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100"
                          : "bg-white border-gray-300 text-gray-400"
                      }
                      ${isClickable ? "hover:scale-110" : ""}
                    `}
                  >
                    {status === "complete" ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-lg font-semibold">{step.id}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="absolute top-14 text-center min-w-[120px]">
                    <p
                      className={`
                        text-sm font-medium
                        ${status === "current" ? "text-blue-600" : "text-gray-700"}
                      `}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-4">
                    <div
                      className={`
                        h-full transition-colors duration-200
                        ${status === "complete" ? "bg-blue-600" : "bg-gray-300"}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </p>
            <p className="text-lg font-semibold text-blue-600">
              {steps.find(s => s.id === currentStep)?.title}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round((currentStep / steps.length) * 100)}%
            </p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            return (
              <button
                key={step.id}
                onClick={() => status === "complete" && onStepClick?.(step.id)}
                disabled={status !== "complete"}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${
                    status === "complete"
                      ? "bg-blue-600 w-8"
                      : status === "current"
                      ? "bg-blue-600 w-8"
                      : "bg-gray-300"
                  }
                  ${status === "complete" ? "cursor-pointer hover:scale-110" : ""}
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
