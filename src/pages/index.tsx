import dynamic from "next/dynamic";
import React from "react";
import Link from 'next/link'
import Head from 'next/head'
import Image from 'next/image'
import { Header } from "../components/header"
function IndexPage() {
  return (
    <>
      <Head>
        <title>津波危険度チェッカー</title>
      </Head>
      <Header/>
      <div className="flex flex-col justify-center items-center h-screen space-y-2 pt-3 px-10">
        <div className="w-full h-1/2 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center" style={{ backgroundImage: 'url(/top1.png)' }}>
          <div className="btn-wrap">
            <Link href="tsunami-judgment" className="btn top-btn"><span>現在位置の危険度を確認！</span><br/>津波危険度チェック<i className="fas fa-angle-double-right"></i></Link>
          </div>
        </div>
        <div className="w-full h-1/2 bg-cover bg-center bg-no-repeat flex flex-col justify-center items-center" style={{ backgroundImage: 'url(/top2.png)' }}>
          <div className="btn-wrap">
            <Link href="map" className="btn top-btn"><span>マップ全体を確認！</span><br/>津波浸水確認マップへ<i className="fas fa-angle-double-right"></i></Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default IndexPage;