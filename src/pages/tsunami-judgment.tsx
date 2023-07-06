import dynamic from "next/dynamic";
import React from "react";
import Link from 'next/link'
import Head from 'next/head'
import { Header } from '../components/header'
function MapPage() {
  const TsunamiDudge =
   dynamic(() => import("../components/tsunami-judge"), {
        loading: () =><></>,
        ssr: false,
    });
  return (
    <div>
      <Head>
        <title>津波危険度チェッカー</title>
      </Head>
      <Header/>
      <div className="container mx-auto lg:px-28 space-y-3 my-1 h-screen">
        <h1 className="text-xl">津波想定被害判定</h1>
        <div className="flex flex-col space-y-3 items-center">
          <TsunamiDudge/>
          <Link href="/map" className="px-2 py-2 rounded-sm bg-sky-400 text-center inline-block">
            全体マップへ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MapPage;