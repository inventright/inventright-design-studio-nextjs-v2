"use client";

import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes } from "lexical";

import ToolbarPlugin from "./lexical/ToolbarPlugin";
import ImagePlugin from "./lexical/ImagePlugin";
import { ImageNode } from "./lexical/ImageNode";

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Plugin to set initial HTML content
function InitialContentPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!html) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, []);

  return null;
}

// Plugin to convert editor state to HTML on change
function HtmlPlugin({ onChange }: { onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor);
          onChange(htmlString);
        });
      }}
    />
  );
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = "Enter email content here...",
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "EmailEditor",
    theme: {
      paragraph: "mb-2",
      heading: {
        h1: "text-4xl font-bold mb-4",
        h2: "text-3xl font-bold mb-3",
        h3: "text-2xl font-bold mb-2",
      },
      list: {
        ul: "list-disc list-inside mb-2",
        ol: "list-decimal list-inside mb-2",
        listitem: "ml-4",
      },
      link: "text-blue-600 underline cursor-pointer",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
      },
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, ImageNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative border rounded-xl bg-white">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 focus:outline-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <ImagePlugin />
          <InitialContentPlugin html={value} />
          <HtmlPlugin onChange={onChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}
