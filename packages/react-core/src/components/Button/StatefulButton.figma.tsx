import React from 'react';
import { Button } from './Button';
import figma from '@figma/code-connect';

/**
 * -- This file was auto-generated by Code Connect --
 * `props` includes a mapping from Figma properties and variants to
 * suggested values. You should update this to match the props of your
 * code component, and update the `example` function to return the
 * code example you'd like to see in Figma
 */

figma.connect(
  Button,
  'https://www.figma.com/design/YqvMyyV4G347jSOgfYXi29/test-code-connect?node-id=5805-20130&m=dev',
  {
    props: {
      text: figma.string('Text ✏️'),
      state: figma.enum('Type', {
        Read: 'read',
        Unread: 'unread',
        'Unread - Needs attention': 'attention'
      }),
      icon: figma.children(['IconWrapper', 'Icon'])
    },
    example: ({ text, ...props }) => (
      <Button variant="stateful" {...props}>
        {text}
      </Button>
    )
  }
);