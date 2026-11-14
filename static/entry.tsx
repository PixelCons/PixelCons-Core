import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../src/pages/index';
import About from '../src/pages/about';
import Terms from '../src/pages/terms';
import NotFound from '../src/pages/404';
import Details from './details';
import {RouterProvider, useRouter} from './router';
import '../src/styles/global.scss';
import './extras.css';

function App() {
  const {route} = useRouter();
  if (route.page === 'browse') return <Home />;
  if (route.page === 'details') return <Details />;
  if (route.page === 'about') return <About />;
  if (route.page === 'terms') return <Terms />;
  return <NotFound />;
}
const params = new URLSearchParams(location.search);
if (!location.hash && (params.has('collection') || params.has('creator')))
  history.replaceState(null, '', location.pathname + '#?' + params.toString());
createRoot(document.getElementById('__next')!).render(
  <RouterProvider>
    <App />
  </RouterProvider>,
);
