import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { BlockNodeView } from '../components/BlockNodeView';

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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'custom-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },
});
