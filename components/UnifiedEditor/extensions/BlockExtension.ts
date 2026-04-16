import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BlockNodeView } from '../components/BlockNodeView';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const layoutSyncKey = new PluginKey('layoutSync');

export const BlockExtension = Node.create({
  name: 'customBlock',
  group: 'block',
  atom: true, 
  draggable: true,

  addAttributes() {
    return {
      blockData: {
        default: null,
      },
      layoutWidth: {
        default: '1/1',
        parseHTML: element => element.getAttribute('layoutwidth') || '1/1',
        renderHTML: attributes => ({
          layoutwidth: attributes.layoutWidth,
        }),
      },
      layoutAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('layoutalign') || 'center',
        renderHTML: attributes => ({
          layoutalign: attributes.layoutAlign,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-block"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const width = node.attrs.layoutWidth || '1/1';
    let widthClass = 'w-full';
    if (width === '1/2') widthClass = 'w-1/2';
    else if (width === '1/3') widthClass = 'w-1/3';
    else if (width === '2/3') widthClass = 'w-[66.666%]';

    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'custom-block',
      class: `custom-block-outer inline-block align-top ${widthClass}`
    })];
  },

  addStorage() {
    return {
      canvasWidth: 'desktop',
      studyId: '',
      studyTitle: '',
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },

  addProseMirrorPlugins() {
    const widthMap: Record<string, string> = {
      '1/1': '100%',
      '1/2': '50%',
      '1/3': '33.3333%',
      '2/3': '66.6666%',
    };

    return [
      new Plugin({
        key: layoutSyncKey,
        view() {
          return {
            update(view) {
              view.state.doc.descendants((node, pos) => {
                if (node.type.name !== 'customBlock') return;
                const lw = node.attrs.layoutWidth || '1/1';
                const pct = widthMap[lw] || '100%';
                
                // Find the DOM node for this ProseMirror position
                const domAtPos = view.nodeDOM(pos);
                if (!domAtPos || !(domAtPos instanceof HTMLElement)) return;

                // TipTap wraps ReactNodeView in a container div.
                // The domAtPos IS that wrapper (it has class like node-customBlock).
                // We apply layout attributes directly to it.
                const wrapper = domAtPos;
                const currentLw = wrapper.getAttribute('layoutwidth');
                if (currentLw !== lw) {
                  wrapper.setAttribute('layoutwidth', lw);
                  wrapper.setAttribute('data-type', 'custom-block');
                  wrapper.style.flex = `0 0 ${pct}`;
                  wrapper.style.maxWidth = pct;
                  wrapper.style.width = pct;
                  wrapper.style.boxSizing = 'border-box';
                }
              });
            },
          };
        },
      }),
    ];
  },
});
