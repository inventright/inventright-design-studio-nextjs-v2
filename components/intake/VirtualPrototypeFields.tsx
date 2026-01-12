import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VirtualPrototypeFields({ formData, setFormData }: { formData: any; setFormData: any }) {
  const [category, setCategory] = useState(formData.category || '');
  const [productDescription, setProductDescription] = useState(formData.productDescription || '');
  const [sketchNotes1, setSketchNotes1] = useState(formData.sketchNotes1 || '');
  const [sketchNotes2, setSketchNotes2] = useState(formData.sketchNotes2 || '');
  const [referencePhotoNotes, setReferencePhotoNotes] = useState(formData.referencePhotoNotes || '');
  const [arUpgrade, setArUpgrade] = useState(formData.arUpgrade || false);
  const [arVirtualPrototype, setArVirtualPrototype] = useState(formData.arVirtualPrototype || false);
  const [animatedVideo, setAnimatedVideo] = useState(formData.animatedVideo || '');

  useEffect(() => {
    updateFormData();
  }, [category, productDescription, sketchNotes1, sketchNotes2, referencePhotoNotes, arUpgrade, arVirtualPrototype, animatedVideo]);

  const updateFormData = () => {
    setFormData({
      ...formData,
      category,
      productDescription,
      sketchNotes1,
      sketchNotes2,
      referencePhotoNotes,
      arUpgrade,
      arVirtualPrototype,
      animatedVideo
    });
  };

  return (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="vpCategory" className="text-black">
          What category best describes your invention?
        </Label>
        <Input
          id="vpCategory"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Enter category"
          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500"
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="vpProductDescription" className="text-black">
          Write a short paragraph describing your invention. What are the issues? When, where, and how will your product be used?
        </Label>
        <Textarea
          id="vpProductDescription"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Describe your invention..."
          className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
        />
      </div>

      {/* Sketch Set 1 */}
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-black">
          <p className="font-semibold mb-2">Label one or two of your sketches of your invention in its whole assembled entirety with all of the part's names according to the names used in your descriptions above. Include notes on key details such as any important materials, colors, or other details that are necessary in your finished virtual prototype. Then upload your files at the bottom.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sketchNotes1" className="text-black">
            Write any notes here that are needed to explain your images and what you want them to look like in the Virtual Prototype.
          </Label>
          <Textarea
            id="sketchNotes1"
            value={sketchNotes1}
            onChange={(e) => setSketchNotes1(e.target.value)}
            placeholder="Enter notes for your sketches..."
            className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
          />
        </div>
      </div>

      {/* Sketch Set 2 */}
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-black">
          <p className="font-semibold mb-2">Create and upload sketch representations of the different parts of your product here. Multiple views are encouraged, and each should show how your product will look and function. If there are any moving parts, be sure to create drawings that show how they move or operate.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sketchNotes2" className="text-black">
            Write any notes here that are needed to explain your images and what you want them to look like in the Virtual Prototype.
          </Label>
          <Textarea
            id="sketchNotes2"
            value={sketchNotes2}
            onChange={(e) => setSketchNotes2(e.target.value)}
            placeholder="Enter notes for your part sketches..."
            className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
          />
        </div>
      </div>

      {/* Reference Photos Set 3 */}
      <div className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-sm text-black">
          <p className="font-semibold mb-2">Upload images of reference photos that may be helpful in better visualizing your product idea. Provide information regarding the reference photos regarding why they are relevant to your product idea. Reference photos can be anything from another product with similar parts to yours, or a specific color, pattern or texture that should be reflected in your virtual prototype design. Or, upload images of your physical prototype and add notes regarding the images, or changes you'd like to make.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="referencePhotoNotes" className="text-black">
            Write any notes here that are needed to explain your images and what you want them to look like in the Virtual Prototype.
          </Label>
          <Textarea
            id="referencePhotoNotes"
            value={referencePhotoNotes}
            onChange={(e) => setReferencePhotoNotes(e.target.value)}
            placeholder="Enter notes for your reference photos..."
            className="glass border-[#4791FF]/30 text-black placeholder:text-gray-500 min-h-32"
          />
        </div>
      </div>

      {/* Optional Upgrades */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-black">Optional Upgrades</h3>
        
        {/* AR Upgrade */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="arUpgrade"
            checked={arUpgrade}
            onCheckedChange={(checked) => setArUpgrade(checked)}
          />
          <div>
            <Label htmlFor="arUpgrade" className="text-black font-medium cursor-pointer">
              AR Upgrade (+$99)
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              Additional FBX file to use your VP with AR Technology.
            </p>
          </div>
        </div>

        {/* Augmented Reality Virtual Prototype */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="arVirtualPrototype"
            checked={arVirtualPrototype}
            onCheckedChange={(checked) => setArVirtualPrototype(checked)}
          />
          <div>
            <Label htmlFor="arVirtualPrototype" className="text-black font-medium cursor-pointer">
              Augmented Reality Virtual Prototype (+$99)
            </Label>
          </div>
        </div>

        {/* 3D Animated Virtual Prototype Video */}
        <div className="space-y-2">
          <Label htmlFor="animatedVideo" className="text-black font-medium">
            3D Animated Virtual Prototype Video
          </Label>
          <Select value={animatedVideo} onValueChange={setAnimatedVideo}>
            <SelectTrigger className="glass border-[#4791FF]/30 text-black">
              <SelectValue placeholder="Select animation option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="rotation">1 – 3D Rotation Only – $300</SelectItem>
              <SelectItem value="exploded">2 – 3D Exploded View Only – $350</SelectItem>
              <SelectItem value="both">3 – 3D Exploded View and Rotation – $400</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}