import {GetStaticProps} from 'next';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    notFound: true,
  };
};

//The create flow is intentionally disabled on the website.
export default function Create() {
  return null;
}
