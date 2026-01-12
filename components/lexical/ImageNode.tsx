import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

import { $applyNodeReplacement, DecoratorNode } from "lexical";
import React, { Suspense, useRef, useState, useEffect } from "react";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey } from "lexical";

export interface ImagePayload {
  altText: string;
  height?: number;
  key?: NodeKey;
  src: string;
  width?: number;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const node = $createImageNode({ altText, height, src, width });
    return { node };
  }
  return null;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    height?: number;
    src: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __altText: string;
  __width: "inherit" | number;
  __height: "inherit" | number;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, src } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      src,
      width,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    if (this.__width !== "inherit") {
      element.setAttribute("width", this.__width.toString());
    }
    if (this.__height !== "inherit") {
      element.setAttribute("height", this.__height.toString());
    }
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width?: "inherit" | number,
    height?: "inherit" | number,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height === "inherit" ? 0 : this.__height,
      src: this.getSrc(),
      type: "image",
      version: 1,
      width: this.__width === "inherit" ? 0 : this.__width,
    };
  }

  setWidthAndHeight(width: "inherit" | number, height: "inherit" | number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): React.JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          nodeKey={this.getKey()}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  altText,
  height,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, key)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width: "inherit" | number;
  height: "inherit" | number;
  nodeKey: NodeKey;
}): React.JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();
  const [dimensions, setDimensions] = useState({
    width: typeof width === "number" ? width : 0,
    height: typeof height === "number" ? height : 0,
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (imageRef.current && dimensions.width === 0) {
      const img = imageRef.current;
      if (img.complete) {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        img.onload = () => {
          setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
      }
    }
  }, [dimensions.width]);

  useEffect(() => {
    if (typeof width === "number" && typeof height === "number") {
      setDimensions({ width, height });
    }
  }, [width, height]);

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === "se") {
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(50, newWidth / aspectRatio);
      } else if (direction === "e") {
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(50, newWidth / aspectRatio);
      } else if (direction === "s") {
        newHeight = Math.max(50, startHeight + deltaY);
        newWidth = Math.max(50, newHeight * aspectRatio);
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setWidthAndHeight(dimensions.width, dimensions.height);
        }
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className="lexical-image-wrapper"
      style={{
        display: "inline-block",
        position: "relative",
        width: dimensions.width || "auto",
        height: dimensions.height || "auto",
      }}
      onClick={() => setSelected(!isSelected)}
    >
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        style={{
          width: dimensions.width || "auto",
          height: dimensions.height || "auto",
          display: "block",
          border: isSelected ? "2px solid #007aff" : "none",
          cursor: isSelected ? "move" : "default",
        }}
        draggable={false}
      />
      {isSelected && !isResizing && (
        <>
          <div
            className="image-resize-handle image-resize-handle-se"
            onMouseDown={(e) => handleMouseDown(e, "se")}
            style={{
              position: "absolute",
              bottom: "-6px",
              right: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#007aff",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "nwse-resize",
              zIndex: 10,
            }}
          />
          <div
            className="image-resize-handle image-resize-handle-e"
            onMouseDown={(e) => handleMouseDown(e, "e")}
            style={{
              position: "absolute",
              top: "50%",
              right: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#007aff",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "ew-resize",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          />
          <div
            className="image-resize-handle image-resize-handle-s"
            onMouseDown={(e) => handleMouseDown(e, "s")}
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              width: "12px",
              height: "12px",
              backgroundColor: "#007aff",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "ns-resize",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          />
        </>
      )}
    </div>
  );
}
