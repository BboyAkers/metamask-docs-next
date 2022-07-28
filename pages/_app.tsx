/* eslint-disable import/no-unassigned-import */
import 'normalize.css';
import '../styles/index.scss';

import type { AppProps } from 'next/app';
import Layout from '../layout';
import { getGuideList } from '../lib/getPages';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
};

export default MyApp;
