import dynamic from "next/dynamic";
import React from "react";
import Head from 'next/head'

import { Header } from "../components/header"

export default function MapPage() {
  const Map = React.useMemo(
    () =>
      dynamic(() => import("../components/map"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );
  return (
    <>
    <Head>
      <title>津波浸水チェッカー</title>
    </Head>
    <Header/>
    <Map />
    </>
  );
}