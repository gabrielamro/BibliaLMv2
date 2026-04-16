import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import tiptapRtePlugin from './TiptapRtePlugin';

interface GrapesBuilderProps {
  initialContent?: any;
  onSave?: (json: any, html: string) => void;
}

export const GrapesBuilder = forwardRef<any, GrapesBuilderProps>(({ initialContent, onSave }, ref) => {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
    insertBlock: (type: string) => {
      if (editorRef.current) {
        // For now, just insert a div with the type to see if it works
        editorRef.current.addComponents({
          tagName: 'div',
          content: `Block: ${type}`,
          attributes: { 'data-gjs-type': type, class: 'p-4 bg-gray-100 border rounded my-2' }
        });
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    if (!editorRef.current) {
      editorRef.current = grapesjs.init({
        container: containerRef.current,
        height: '100vh',
        width: 'auto',
        storageManager: false, 
        plugins: [
          webpagePreset,
          tiptapRtePlugin
        ],
        pluginsOpts: {
          [webpagePreset as any]: {
          }
        },
        canvas: {
          styles: [
            'https://cdn.tailwindcss.com' 
          ]
        }
      });

      const editor = editorRef.current;

      editor.on('update', () => {
        if (onSave) {
          const html = editor.getHtml();
          const css = editor.getCss();
          const components = editor.getProjectData().components;
          const style = editor.getProjectData().styles;
          
          onSave(
            { components, style }, 
            `<style>${css}</style>\n${html}`
          );
        }
      });
      
      if (initialContent?.components) {
        editor.setComponents(initialContent.components);
      }
      if (initialContent?.style) {
        editor.setStyle(initialContent.style);
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen border rounded-lg overflow-hidden shadow-lg">
      <div ref={containerRef}></div>
    </div>
  );
});

GrapesBuilder.displayName = 'GrapesBuilder';

