import {GetStaticProps} from 'next';
import React from 'react';
import Layout from '../components/layout';
import Canvas from '../components/pages/create/canvas';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The create page to create new pixelcons and collections
export default function Create() {
  //render
  return (
    <Layout>
      <Canvas></Canvas>
    </Layout>
  );
}
