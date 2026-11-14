import React from 'react';
import {createPortal} from 'react-dom';
export default function Head({children}: {children: React.ReactNode}) {
  return createPortal(children, document.head);
}
