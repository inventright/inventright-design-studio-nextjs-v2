import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";

// React component for the resizable image
function ResizableImageComponent({ node, updateAttributes }: any) {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || null,
    height: node.attrs.height || null,
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Load natural dimensions when image loads
  useEffect(() => {
    if (imageRef.current && !node.attrs.width) {
      const img = imageRef.current;
      img.onload = () => {
        setDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        updateAttributes({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;
      
      let newWidth = startPos.current.width;
      let newHeight = startPos.current.height;

      if (corner.includes("e")) {
        newWidth = Math.max(50, startPos.current.width + deltaX);
      }
      if (corner.includes("s")) {
        newHeight = Math.max(50, startPos.current.height + deltaY);
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      updateAttributes({
        width: dimensions.width,
        height: dimensions.height,
      });
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-drag-handle="">
      <div
        className="resizable-image-container"
        style={{
          width: dimensions.width ? `${dimensions.width}px` : 'auto',
          height: dimensions.height ? `${dimensions.height}px` : 'auto',
          position: "relative",
          display: "inline-block",
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "0.5rem",
          }}
        />
        
        {/* Resize handles */}
        <div
          className="resize-handle resize-handle-se"
          onMouseDown={(e) => handleMouseDown(e, "se")}
          style={{
            position: "absolute",
            bottom: "-5px",
            right: "-5px",
            width: "15px",
            height: "15px",
            background: "#007aff",
            border: "2px solid white",
            borderRadius: "50%",
            cursor: "nwse-resize",
            zIndex: 10,
          }}
        />
        <div
          className="resize-handle resize-handle-e"
          onMouseDown={(e) => handleMouseDown(e, "e")}
          style={{
            position: "absolute",
            top: "50%",
            right: "-5px",
            width: "15px",
            height: "15px",
            background: "#007aff",
            border: "2px solid white",
            borderRadius: "50%",
            cursor: "ew-resize",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        />
        <div
          className="resize-handle resize-handle-s"
          onMouseDown={(e) => handleMouseDown(e, "s")}
          style={{
            position: "absolute",
            bottom: "-5px",
            left: "50%",
            width: "15px",
            height: "15px",
            background: "#007aff",
            border: "2px solid white",
            borderRadius: "50%",
            cursor: "ns-resize",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}

// TipTap extension
export const ResizableImage = Node.create({
  name: "resizableImage",

  group: "inline",

  inline: true,

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
