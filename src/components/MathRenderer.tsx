import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer = ({ content, className = "" }: MathRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderMath = () => {
      if (!containerRef.current) return;
      
      let processedContent = content;

      // Replace display math: $$...$$
      processedContent = processedContent.replace(
        /\$\$(.*?)\$\$/gs,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: true,
              throwOnError: false,
              strict: false
            });
          } catch (e) {
            return `$$${math}$$`;
          }
        }
      );

      // Replace inline math: \(...\)
      processedContent = processedContent.replace(
        /\\\((.*?)\\\)/gs,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
              strict: false
            });
          } catch (e) {
            return `\\(${math}\\)`;
          }
        }
      );

      // Replace inline math: $...$
      processedContent = processedContent.replace(
        /\$([^\$\n]+?)\$/g,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
              strict: false
            });
          } catch (e) {
            return `$${math}$`;
          }
        }
      );

      containerRef.current.innerHTML = processedContent;
    };

    renderMath();
  }, [content]);

  return <div ref={containerRef} className={className} />;
};

export default MathRenderer;
