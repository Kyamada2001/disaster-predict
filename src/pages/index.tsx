import dynamic from "next/dynamic";
import React from "react";
import Link from 'next/link'
import Head from 'next/head'
import { Header } from "../components/header"
function IndexPage() {
  return (
    <>
      <Head>
        <title>津波想定被害チェッカー</title>
      </Head>
        <Header/>
        <div className="flex flex-col justify-center items-center h-screen">
          <div>
            <Link href="tsunami-judgment">
              現在位置が安全か判定する
            </Link>
          </div>
          <div>
            <Link href="map">
              津波被害想定マップへ移動
            </Link>
          </div>
        </div>
    </>
  );
}

export default IndexPage;