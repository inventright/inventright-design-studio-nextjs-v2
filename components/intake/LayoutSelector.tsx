import { Check } from "lucide-react";

export interface LayoutOption {
  id: string;
  name: string;
  description: string;
  preview: string; // SVG or image path
}

interface LayoutSelectorProps {
  options: LayoutOption[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function LayoutSelector({ options, selected, onSelect }: LayoutSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((option: any) => {
        const isSelected = selected === option.id;
        
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`
              relative p-4 border-2 rounded-lg transition-all
              hover:shadow-md
              ${
                isSelected
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }
            `}
          >
            {/* Selected Checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Layout Preview */}
            <div className="aspect-[8.5/11] bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
              {option.preview.startsWith("<svg") ? (
                <div dangerouslySetInnerHTML={{ __html: option.preview }} />
              ) : (
                <img
                  src={option.preview}
                  alt={option.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Layout Info */}
            <div className="text-left">
              <h3
                className={`font-semibold mb-1 ${
                  isSelected ? "text-blue-900" : "text-gray-900"
                }`}
              >
                {option.name}
              </h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Predefined layout previews
export const SELL_SHEET_LAYOUTS: LayoutOption[] = [
  {
    id: "photo",
    name: "Photo Layout",
    description: "Single hero image with product details",
    preview: `<svg viewBox="0 0 85 110" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect width="85" height="110" fill="#f3f4f6"/>
      <rect x="5" y="5" width="75" height="50" fill="#e5e7eb" rx="2"/>
      <rect x="5" y="60" width="75" height="3" fill="#d1d5db" rx="1"/>
      <rect x="5" y="67" width="60" height="2" fill="#e5e7eb" rx="1"/>
      <rect x="5" y="72" width="55" height="2" fill="#e5e7eb" rx="1"/>
      <rect x="5" y="77" width="65" height="2" fill="#e5e7eb" rx="1"/>
      <circle cx="42.5" cy="95" r="8" fill="#3b82f6"/>
    </svg>`,
  },
  {
    id: "problem-solution",
    name: "Problem/Solution",
    description: "Before and after comparison",
    preview: `<svg viewBox="0 0 85 110" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect width="85" height="110" fill="#f3f4f6"/>
      <rect x="5" y="5" width="35" height="45" fill="#fecaca" rx="2"/>
      <rect x="45" y="5" width="35" height="45" fill="#bbf7d0" rx="2"/>
      <text x="22.5" y="30" text-anchor="middle" font-size="8" fill="#991b1b">Problem</text>
      <text x="62.5" y="30" text-anchor="middle" font-size="8" fill="#166534">Solution</text>
      <rect x="5" y="55" width="75" height="2" fill="#d1d5db" rx="1"/>
      <rect x="5" y="60" width="60" height="2" fill="#e5e7eb" rx="1"/>
      <rect x="5" y="65" width="55" height="2" fill="#e5e7eb" rx="1"/>
    </svg>`,
  },
  {
    id: "storyboard",
    name: "Storyboard",
    description: "Three-panel story sequence",
    preview: `<svg viewBox="0 0 85 110" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
      <rect width="85" height="110" fill="#f3f4f6"/>
      <rect x="5" y="5" width="23" height="30" fill="#e5e7eb" rx="2"/>
      <rect x="31" y="5" width="23" height="30" fill="#e5e7eb" rx="2"/>
      <rect x="57" y="5" width="23" height="30" fill="#e5e7eb" rx="2"/>
      <text x="16.5" y="23" text-anchor="middle" font-size="6" fill="#6b7280">1</text>
      <text x="42.5" y="23" text-anchor="middle" font-size="6" fill="#6b7280">2</text>
      <text x="68.5" y="23" text-anchor="middle" font-size="6" fill="#6b7280">3</text>
      <rect x="5" y="40" width="75" height="2" fill="#d1d5db" rx="1"/>
      <rect x="5" y="45" width="60" height="2" fill="#e5e7eb" rx="1"/>
    </svg>`,
  },
];
