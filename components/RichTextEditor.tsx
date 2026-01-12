"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { Button } from "./ui/button";
import { ImagePlus } from "lucide-react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuillComponent = dynamic(() => import("react-quill"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter email content here...",
}: RichTextEditorProps) {
  const [quillInstance, setQuillInstance] = useState<any>(null);

  // Handle image upload
  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);

        // Upload to your API
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.url;

          // Insert image into editor
          if (quillInstance) {
            const range = quillInstance.getSelection(true);
            if (range) {
              quillInstance.insertEmbed(range.index, "image", imageUrl);
              quillInstance.setSelection(range.index + 1, 0);
            }
          }
        } else {
          alert("Failed to upload image");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image");
      }
    };
  };

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link"],
          ["clean"],
        ],
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "link",
    "image",
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Email Body</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleImageUpload}
          className="flex items-center gap-2"
        >
          <ImagePlus className="w-4 h-4" />
          Upload Image
        </Button>
      </div>
      <div className="border rounded-xl overflow-hidden bg-white">
        <ReactQuillComponent
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="rich-text-editor"
          onChangeSelection={(selection, source, editor) => {
            setQuillInstance(editor);
          }}
        />
      </div>
      <p className="text-sm text-gray-500">
        You can use variables like {"{"}client_name{"}"}, {"{"}job_name{"}"},{" "}
        {"{"}job_number{"}"}, {"{"}designer_name{"}"}, etc.
      </p>
    </div>
  );
}
