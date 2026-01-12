import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LineDrawingFields({ formData, setFormData }: { formData: any; setFormData: any }) {
  const [virtualPrototype, setVirtualPrototype] = useState(formData.virtualPrototype || '');
  const [drawingType, setDrawingType] = useState(formData.drawingType || '');
  const [numberOfDrawings, setNumberOfDrawings] = useState(formData.numberOfDrawings || '3');
  const [storyboardDescription, setStoryboardDescription] = useState(formData.storyboardDescription || '');
  const [drawings, setDrawings] = useState(formData.drawings || [
    { description: '', notes: '' },
    { description: '', notes: '' },
    { description: '', notes: '' }
  ]);

  useEffect(() => {
    updateFormData();
  }, [virtualPrototype, drawingType, numberOfDrawings, storyboardDescription, drawings]);

  const updateFormData = () => {
    setFormData({
      ...formData,
      virtualPrototype,
      drawingType,
      numberOfDrawings,
      storyboardDescription,
      drawings
    });
  };

  const handleVirtualPrototypeChange = (value: any) => {
    setVirtualPrototype(value);
  };

  const handleDrawingTypeChange = (value: any) => {
    setDrawingType(value);
  };

  const handleNumberOfDrawingsChange = (value: any) => {
    setNumberOfDrawings(value);
    const num = parseInt(value);
    const newDrawings = [];
    for (let i = 0; i < num; i++) {
      newDrawings.push(drawings[i] || { description: '', notes: '' });
    }
    setDrawings(newDrawings);
  };

  const handleStoryboardDescriptionChange = (value: any) => {
    setStoryboardDescription(value);
  };

  const handleDrawingChange = (index: any, field: any, value: any) => {
    const newDrawings = [...drawings];
    newDrawings[index][field] = value;
    setDrawings(newDrawings);
  };

  return (
    <div className="space-y-6">
      {/* Virtual Prototype Question */}
      <div className="space-y-3">
        <Label className="text-black">
          Did Design Studio already create a virtual prototype for you? *
        </Label>
        <RadioGroup value={virtualPrototype} onValueChange={handleVirtualPrototypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Yes" id="prototype-yes" />
            <Label htmlFor="prototype-yes" className="text-black font-normal cursor-pointer">
              Yes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="No" id="prototype-no" />
            <Label htmlFor="prototype-no" className="text-black font-normal cursor-pointer">
              No
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Drawing Type Question */}
      <div className="space-y-3">
        <Label className="text-black">Choose your line drawing type: *</Label>
        <RadioGroup value={drawingType} onValueChange={handleDrawingTypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Storyboard line drawings" id="type-storyboard" />
            <Label htmlFor="type-storyboard" className="text-black font-normal cursor-pointer">
              1 – Storyboard line drawings
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Provisional Patent Application Figures" id="type-patent" />
            <Label htmlFor="type-patent" className="text-black font-normal cursor-pointer">
              2 – Provisional Patent Application Figures
            </Label>
          </div>
        </RadioGroup>

        {/* Explanatory Text */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-black space-y-3">
          <div>
            <strong>Storyboard Line Drawings</strong>
            <ul className="list-disc ml-5 mt-1">
              <li>Used to simply and plainly display a multi-step process or function</li>
              <li>Basic representations put focus on function and features instead of design</li>
              <li>Typically not labeled unless needed for clarity</li>
            </ul>
          </div>
          <div>
            <strong>Provisional Patent Application Figures (Utility drawings)</strong>
            <ul className="list-disc ml-5 mt-1">
              <li>Detailed drawings with the purpose of understanding the key functions, utility, and design specifications of a product</li>
              <li>Patent illustrations require multiple views to help facilitate an understanding of the invention</li>
              <li>These drawings must show every feature of the invention specified in the claims of the patent or provisional patent application</li>
              <li>Black ink line drawings are the most common, but color drawings may be used if necessary to demonstrate the claimed features or function</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Storyboard-specific field */}
      {drawingType === 'Storyboard line drawings' && (
        <>
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-black">
            <ul className="list-disc ml-5 space-y-1">
              <li>Storyboard line drawings are used to simply and plainly display a multi-step process or function</li>
              <li>They are a basic representation that puts focus on function and features instead of design</li>
              <li>Typically not labeled unless needed for clarity</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="storyboardDescription" className="text-black">
              Enter a short description of your story board and what you are looking for in the way of drawings for it.
            </Label>
            <Textarea
              id="storyboardDescription"
              value={storyboardDescription}
              onChange={(e) => handleStoryboardDescriptionChange(e.target.value)}
              placeholder="Describe your storyboard..."
              className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
            />
          </div>
        </>
      )}

      {/* Number of Drawings Selection */}
      {(drawingType === 'Storyboard line drawings' || drawingType === 'Provisional Patent Application Figures') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="numberOfDrawings" className="text-black">
              Select the number of line drawings below: *
            </Label>
            <Select value={numberOfDrawings} onValueChange={handleNumberOfDrawingsChange}>
              <SelectTrigger className="glass border-[#4791FF]/30 text-black">
                <SelectValue placeholder="Select number of drawings" />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">
              You must select the number of drawings you want. We have a minimum of 3. Each drawing is $30.
            </p>
          </div>

          {/* Dynamic Drawing Fields */}
          <div className="space-y-6">
            {drawings.map((drawing: any, index: any) => (
              <div key={index} className="p-4 bg-white border-2 border-[#4791FF]/30 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-black">
                  Line Drawing/Figure #{index + 1}
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor={`drawing-desc-${index}`} className="text-black">
                    Brief description of your sketch(s)/Photograph. Number it the same number as above so we know which one it is.
                  </Label>
                  <Textarea
                    id={`drawing-desc-${index}`}
                    value={drawing.description}
                    onChange={(e) => handleDrawingChange(index, 'description', e.target.value)}
                    placeholder={`Description for Drawing/Figure #${index + 1}`}
                    className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`drawing-notes-${index}`} className="text-black">
                    Figure/Label and/or Additional Notes:
                  </Label>
                  <Textarea
                    id={`drawing-notes-${index}`}
                    value={drawing.notes}
                    onChange={(e) => handleDrawingChange(index, 'notes', e.target.value)}
                    placeholder="Additional notes or labels"
                    className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-24"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}