import { Check } from "lucide-react";
import { useState } from "react";

export interface ColorOption {
  name: string;
  hex: string;
  category?: string;
}

interface ColorPaletteProps {
  colors: ColorOption[];
  selected: string[];
  onSelect: (colors: string[]) => void;
  maxSelection?: number;
  label?: string;
}

export default function ColorPalette({
  colors,
  selected,
  onSelect,
  maxSelection = 3,
  label = "Select Colors",
}: ColorPaletteProps) {
  const toggleColor = (hex: string) => {
    if (selected.includes(hex)) {
      onSelect(selected.filter((c) => c !== hex));
    } else if (selected.length < maxSelection) {
      onSelect([...selected, hex]);
    }
  };

  // Group colors by category if available
  const groupedColors = colors.reduce((acc, color) => {
    const category = color.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(color);
    return acc;
  }, {} as Record<string, ColorOption[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-500">
          {selected.length} / {maxSelection} selected
        </span>
      </div>

      {Object.entries(groupedColors).map(([category, categoryColors]) => (
        <div key={category}>
          {Object.keys(groupedColors).length > 1 && (
            <h4 className="text-xs font-semibold text-gray-600 mb-2">{category}</h4>
          )}
          <div className="grid grid-cols-8 gap-2">
            {categoryColors.map((color) => {
              const isSelected = selected.includes(color.hex);
              const isDisabled = !isSelected && selected.length >= maxSelection;

              return (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => toggleColor(color.hex)}
                  disabled={isDisabled}
                  className={`
                    relative w-10 h-10 rounded-lg border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isSelected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-300"}
                    ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Colors Display */}
      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Selected Colors:</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((hex) => {
              const color = colors.find((c) => c.hex === hex);
              return (
                <div
                  key={hex}
                  className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200"
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-xs text-gray-700">{color?.name || hex}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Predefined color palettes
export const PRODUCT_COLORS: ColorOption[] = [
  // Primary Colors
  { name: "Red", hex: "#EF4444", category: "Primary" },
  { name: "Blue", hex: "#3B82F6", category: "Primary" },
  { name: "Yellow", hex: "#F59E0B", category: "Primary" },
  { name: "Green", hex: "#10B981", category: "Primary" },
  { name: "Purple", hex: "#8B5CF6", category: "Primary" },
  { name: "Pink", hex: "#EC4899", category: "Primary" },
  { name: "Orange", hex: "#F97316", category: "Primary" },
  { name: "Teal", hex: "#14B8A6", category: "Primary" },

  // Neutrals
  { name: "White", hex: "#FFFFFF", category: "Neutral" },
  { name: "Light Gray", hex: "#E5E7EB", category: "Neutral" },
  { name: "Gray", hex: "#9CA3AF", category: "Neutral" },
  { name: "Dark Gray", hex: "#4B5563", category: "Neutral" },
  { name: "Black", hex: "#000000", category: "Neutral" },
  { name: "Beige", hex: "#D4C5B9", category: "Neutral" },
  { name: "Cream", hex: "#FFFDD0", category: "Neutral" },
  { name: "Brown", hex: "#92400E", category: "Neutral" },

  // Metallics
  { name: "Gold", hex: "#FFD700", category: "Metallic" },
  { name: "Silver", hex: "#C0C0C0", category: "Metallic" },
  { name: "Bronze", hex: "#CD7F32", category: "Metallic" },
  { name: "Copper", hex: "#B87333", category: "Metallic" },
  { name: "Rose Gold", hex: "#B76E79", category: "Metallic" },
  { name: "Platinum", hex: "#E5E4E2", category: "Metallic" },
  { name: "Chrome", hex: "#AAA9AD", category: "Metallic" },
  { name: "Brass", hex: "#B5A642", category: "Metallic" },
];
