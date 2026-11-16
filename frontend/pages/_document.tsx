import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `
          window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element');
          }
        `}} />
        <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
      </body>
    </Html>
  );
}
