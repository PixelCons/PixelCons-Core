import {GetStaticProps} from 'next';
import React from 'react';
import Layout from '../components/layout';
import Upload from '../components/pages/upload/uploader';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The upload page to create new pixelcons via file upload
export default function Create() {
  //render
  return (
    <Layout>
      <Upload></Upload>
    </Layout>
  );
}
