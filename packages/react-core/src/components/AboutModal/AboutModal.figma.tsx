import React from 'react';
import { AboutModal } from './AboutModal';
import figma from '@figma/code-connect';

/**
 * -- This file was auto-generated by Code Connect --
 * `props` includes a mapping from Figma properties and variants to
 * suggested values. You should update this to match the props of your
 * code component, and update the `example` function to return the
 * code example you'd like to see in Figma
 */

figma.connect(
  AboutModal,
  'https://www.figma.com/design/YqvMyyV4G347jSOgfYXi29/test-code-connect?node-id=2879-13973&t=JTehBU2pTTE3vVQx-4',
  {
    props: {
      productName: figma.string('Product name')
    },
    example: ({ productName }) => (
      <AboutModal
        isOpen={true}
        onClose={() => {}}
        brandImageAlt="image alt text"
        brandImageSrc="/assets/brand_image_src.jpg"
        backgroundImageSrc="/assets/background_image_src.jpg"
        productName={productName}
        trademark={'Sample footer trademark text'}
      >
        {'About modal children content here'}
      </AboutModal>
    )
  }
);