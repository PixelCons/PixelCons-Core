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

//The about page to explain pixelcons
export default function About() {
  return (
    <Layout>
      <section className={utilStyles.headingMd}>
        <p>This is the ABOUT page</p>
      </section>
    </Layout>
  );
}
