import React from 'react';
import {GetStaticProps} from 'next';
import Layout from '../components/layout';
import utilStyles from '../styles/utils.module.css';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The create page to create new pixelcons and collections
export default function Create() {
  return (
    <Layout>
      <section className={utilStyles.headingMd}>
        <p>This is the CREATE page</p>
      </section>
    </Layout>
  );
}
