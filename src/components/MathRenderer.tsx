import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer = ({ content, className = "" }: MathRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const renderMath = () => {
      if (!containerRef.current) return;
      
      let processedContent = content;

      // Replace display math: $$...$$ (multiline support)
      processedContent = processedContent.replace(
        /\$\$([\s\S]*?)\$\$/g,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: true,
              throwOnError: false,
              strict: false,
              trust: true,
              macros: {
                "\\eqref": "\\href{#1}{}",
                "\\label": "\\htmlId{#1}{}",
              }
            });
          } catch (e) {
            console.error('KaTeX display math error:', e);
            return `<span class="katex-error" style="color: red;">$$${math}$$</span>`;
          }
        }
      );

      // Replace inline math: \(...\)
      processedContent = processedContent.replace(
        /\\\(([\s\S]*?)\\\)/g,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch (e) {
            console.error('KaTeX inline math error:', e);
            return `<span class="katex-error" style="color: red;">\\(${math}\\)</span>`;
          }
        }
      );

      // Replace inline math: $...$ (but not $$)
      processedContent = processedContent.replace(
        /(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g,
        (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch (e) {
            console.error('KaTeX inline $ math error:', e);
            return `<span class="katex-error" style="color: red;">$${math}$</span>`;
          }
        }
      );

      containerRef.current.innerHTML = processedContent;
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(renderMath);
  }, [content]);

  return <div ref={containerRef} className={className} style={{ lineHeight: '1.8' }} />;
};

export default MathRenderer;
