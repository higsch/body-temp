import App from './App.svelte';
import CookiesEuBanner from '../node_modules/cookies-eu-banner/dist/cookies-eu-banner.min.js';

const app = new App({
  target: document.body
});

new CookiesEuBanner(function () {
  console.log('test')
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-156964030-1');
}, true);

export default app;
