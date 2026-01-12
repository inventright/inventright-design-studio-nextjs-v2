"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Undo,
  Redo,
} from "lucide-react";
import { INSERT_IMAGE_COMMAND } from "./ImagePlugin";

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element;
          const type = parentList.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (level: 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(`h${level}`));
      }
    });
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

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
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: data.url,
            altText: file.name,
          });
        } else {
          const errorData = await response.json();
          alert(`Failed to upload image: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image");
      }
    };
  };

  return (
    <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 rounded-t-xl">
      {/* Text Style Dropdown */}
      <Select
        value={blockType}
        onValueChange={(value) => {
          if (value === "paragraph") {
            formatParagraph();
          } else if (value === "h1") {
            formatHeading(1);
          } else if (value === "h2") {
            formatHeading(2);
          } else if (value === "h3") {
            formatHeading(3);
          }
        }}
      >
        <SelectTrigger className="w-[120px] h-8 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      {/* Undo/Redo */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo className="w-4 h-4" />
      </Button>

      {/* Text Formatting */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={isBold ? "bg-gray-200" : ""}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={isItalic ? "bg-gray-200" : ""}
      >
        <Italic className="w-4 h-4" />
      </Button>

      {/* Lists */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={formatBulletList}
        className={blockType === "bullet" ? "bg-gray-200" : ""}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={formatNumberedList}
        className={blockType === "number" ? "bg-gray-200" : ""}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      {/* Image Upload */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleImageUpload}
      >
        <ImagePlus className="w-4 h-4" />
        <span className="ml-1">Upload Image</span>
      </Button>
    </div>
  );
}
