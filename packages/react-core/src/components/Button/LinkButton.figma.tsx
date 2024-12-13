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

figma.connect(Button, 'https://www.figma.com/design/YqvMyyV4G347jSOgfYXi29/test-code-connect?node-id=1259-745&m=dev', {
  props: {
    text: figma.string('✏️ Text'),
    // text: figma.string('Text'),
    iconPosition: figma.boolean('Icon right', {
      true: 'end',
      false: undefined
    }),
    icon: figma.children(['IconWrapper', 'Icon']),
    isDanger: figma.enum('Type', {
      Danger: true
    }),
    isLoading: figma.enum('Type', {
      Progress: true
    }),
    spinnerAriaValueText: figma.enum('Type', {
      Progress: 'Loading'
    }),
    spinnerAriaLabel: figma.enum('Type', {
      Progress: 'Content being loaded'
    }),
    isDisabled: figma.enum('State', {
      Disabled: true
    }),
    size: figma.enum('Size', {
      Small: 'sm'
    }),
    countOptions: figma.enum('Type', {
      'Button with count': {
        isRead: false,
        count: 0,
        className: 'custom-badge-unread'
      }
    })
  },
  example: ({ text, ...props }) => (
    <Button variant="link" {...props}>
      {text}
    </Button>
  )
});