import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/context/ToastContext";
import Layout from "@/layouts/DashboardLayout";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import Head from "next/head";
import favicon32 from "@/assets/icons/favicon-32x32.png";
import favicon16 from "@/assets/icons/favicon-16x16.png";
import appleTouchIcon from "@/assets/icons/apple-touch-icon.png";
import android192 from "@/assets/icons/android-chrome-192x192.png";
import android512 from "@/assets/icons/android-chrome-512x512.png";
import faviconRoot from "@/assets/icons/favicon-root.ico";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href={favicon32.src} />
        <link rel="icon" type="image/png" sizes="16x16" href={favicon16.src} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon.src} />
        <link rel="icon" type="image/png" sizes="192x192" href={android192.src} />
        <link rel="icon" type="image/png" sizes="512x512" href={android512.src} />
        <link rel="icon" href={faviconRoot.src} />
      </Head>
      <ToastProvider>
        {getLayout(<Component {...pageProps} />)}
      </ToastProvider>
    </SessionProvider>
  );
}
