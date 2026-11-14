import React from 'react';
import optimizedImages from 'ultra-lite:images';
export default function Image({alt, ...props}: React.ImgHTMLAttributes<HTMLImageElement> & {src: string}) {
  const optimized = optimizedImages[props.src];
  const image = (
    <img
      {...props}
      src={optimized?.one || props.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{color: 'transparent', ...props.style}}
    />
  );
  return optimized ? (
    <picture style={{display: 'contents'}}>
      <source media="(min-resolution: 1.01dppx)" srcSet={optimized.two} />
      {image}
    </picture>
  ) : (
    image
  );
}
