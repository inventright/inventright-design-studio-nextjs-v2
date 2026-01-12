"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import { ResizableImage } from "./ResizableImage";
import { Button } from "./ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImagePlus,
  Link as LinkIcon,
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom
        paragraph: false, // Disable default paragraph to use custom
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Paragraph,
      ResizableImage,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] max-h-[500px] overflow-y-auto p-4",
      },
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/email-templates/upload-image", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.url;

          if (imageUrl) {
            editor.chain().focus().insertContent({
              type: "resizableImage",
              attrs: {
                src: imageUrl,
              },
            }).run();
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Upload failed:", errorData);
          alert(`Failed to upload image: ${errorData.details || response.statusText}`);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image");
      }
    };
  };

  const handleAddLink = () => {
    const url = prompt("Enter URL:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Email Body</label>
      </div>

      {/* Toolbar */}
      <div className="border rounded-t-xl bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Style Dropdown */}
        <Select
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : "p"
          }
          onValueChange={(value) => {
            if (value === "p") {
              editor.chain().focus().setParagraph().run();
            } else if (value === "h1") {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            } else if (value === "h2") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else if (value === "h3") {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }
          }}
        >
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size Selector */}
        <Select
          value={"16"}
          onValueChange={(value) => {
            editor.chain().focus().setMark("textStyle", { fontSize: `${value}px` }).run();
          }}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10px</SelectItem>
            <SelectItem value="12">12px</SelectItem>
            <SelectItem value="14">14px</SelectItem>
            <SelectItem value="16">16px</SelectItem>
            <SelectItem value="18">18px</SelectItem>
            <SelectItem value="24">24px</SelectItem>
            <SelectItem value="36">36px</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
          }
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={
            editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
          }
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        
        {/* Indent Buttons */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const { state } = editor;
            const { from } = state.selection;
            const node = state.doc.nodeAt(from);
            if (node) {
              const currentMargin = parseInt(node.attrs.style?.match(/margin-left:\s*(\d+)px/)?.[1] || "0");
              editor.chain().focus().updateAttributes(node.type.name, {
                style: `margin-left: ${currentMargin + 40}px`
              }).run();
            }
          }}
          title="Increase indent"
        >
          <IndentIncrease className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const { state } = editor;
            const { from } = state.selection;
            const node = state.doc.nodeAt(from);
            if (node) {
              const currentMargin = parseInt(node.attrs.style?.match(/margin-left:\s*(\d+)px/)?.[1] || "0");
              const newMargin = Math.max(0, currentMargin - 40);
              editor.chain().focus().updateAttributes(node.type.name, {
                style: newMargin > 0 ? `margin-left: ${newMargin}px` : ""
              }).run();
            }
          }}
          title="Decrease indent"
        >
          <IndentDecrease className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
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

      {/* Editor */}
      <div className="border border-t-0 rounded-b-xl bg-white">
        <EditorContent editor={editor} />
      </div>

      <p className="text-sm text-gray-500">
        You can use variables like {"{"}client_name{"}"}, {"{"}job_name{"}"},{" "}
        {"{"}job_number{"}"}, {"{"}designer_name{"}"}, etc.
      </p>
    </div>
  );
}
