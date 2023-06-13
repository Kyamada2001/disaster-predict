import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import Image from 'next/image'
import dynamic from "next/dynamic";
import React from "react";
import "leaflet/dist/leaflet.css";

import { PrefectureCodes, STATUS_CODES, ERROR_CODES } from '@/consts/codes';
import { validateHeaderValue } from 'http';
import { unpublishedPref } from '../consts/shape-unpublished-prefectures'

// TODO: geojsonのnullFeatureを削除する
// TODO: geojson読み込みを非同期で行う

const Judgement =() => {
  const [polygonData, setPolygonData] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [inRangePolygon, setInRangePolygon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currPoint , setCurrPoint] = useState(Object);
  const [errCode, setErrCode] = useState(String);
  const [currPref, setCurrPref] = useState(null)

  const dispUnpublishPref: any = unpublishedPref.map((pref: String, index) => {
    return <li key={index}>{pref}</li>
  })

  const Map = React.useMemo(
    () =>
      dynamic(() => import("./map"), {
        loading: () => <></>,
        ssr: false,
      }),
    []
  );

  const SmallMap: React.FC<{ currPoint: { latitude: number, longitude: number } }> = function SmallMap({currPoint}){
    return (
      <Map 
        center={[currPoint.latitude, currPoint.longitude]} 
        zoom={14} 
        style={{width: "100%", height: "400px"}}
        markerON={true}
      />
    );
  }

  useEffect(() => {
    if(!currPoint.latitude) {
      return;
    }
    new Promise(async function getCurrPref(resolve) {
      try{
        const response = await fetch(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${currPoint.latitude}&lon=${currPoint.longitude}`);
        const data = await response.json();
        const locationStr = data.results.muniCd;
        const prefectureCode: any = locationStr.substr(0,2);
        const prefecture =  PrefectureCodes.filter((pref) => {
          return pref.code == prefectureCode;
        })[0].prefecture; 
        resolve(prefecture);
      }catch(e) {
        setCurrPref(null)
      }
    }).then((pref: any) => {
      setCurrPref(pref);
    })
  },[currPoint])

  useEffect(() => {
    // geolocation APIで現在位置を取得し、座標と県を取得
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setCurrPoint({
        latitude: latitude, 
        longitude: longitude
      });
    });

      // テスト用(津波範囲内の座標): 139.93991418300004,40.43372814600008
      // テスト用(沖の座標): 130.410000000000000,34.014000000000000
      // テスト用(未公開都道府県-東京): 139.813200000000000, 35.666600000000000
      // テスト用(海外): 127.856000000000000,35.159000000000000
      // const currPoint = {
      //   latitude:42.9649,
      //   longitude:144.0772,
      // }
      // setCurrPoint(currPoint);
  }, []);

  useEffect(() =>{
    // TODO:ローディング画面をコンポーネントで作成した場合は削除
    if(!currPoint.latitude) {
      return;
    }
    new Promise( async function getTsunamiPolygon() {
      const response: any = await fetch('/api/tsunami-judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currPoint),
      }).catch((err) => {
        setIsLoading(false);
        setErrCode(ERROR_CODES.SERVER_ERROR)
      });
      const data = await response.json();

      if(response.status == STATUS_CODES.SUCCESS) {
        if(data.inRangePolygon){
          setIsInside(true);
          setInRangePolygon(data);
        } else {
          setIsInside(false);
        }
      }else {
        setErrCode(ERROR_CODES.SERVER_ERROR)
      }
      setIsLoading(false);
    }).catch((err) => {
      setIsLoading(false);
      setErrCode(ERROR_CODES.SERVER_ERROR)
    })
  },[currPoint])

    if(isLoading) {
      return <Image src="/loading.gif" alt="laoding logo" fill ></Image>;
    } else {
      if(errCode) {
        let errMessage: any;
        if(errCode == ERROR_CODES.POLYGONFILE_NOT_FOUND) {
            errMessage= (
              <>
                <div>
                  <div>申し訳ありません。<br/>{currPref}はデータが公開されていないため、情報を取得することができません。<br/>地方自治体の避難情報に従ってください。</div>
                </div>
              </>
            );
        } else if(errCode == ERROR_CODES.PREFECTURE_NOT_FOUND) {
          errMessage = (
              <>
                <div className='text-red-400'>位置情報を取得できませんでした。</div>
              </>
            )
        } else if (errCode == ERROR_CODES.OUTSIDE_JAPAN) {
          errMessage = (
            <>
              <div className='text-red-400'>申し訳ありません。位置情報を取得できませんでした。※日本外では、津波想定判定機能はご利用できません。</div>
            </>
          )
        } else if (errCode == ERROR_CODES.SERVER_ERROR) {
          errMessage = (
            <>
              <div className='text-red-400'>エラーが発生しました。</div>
            </>
          )
        }
        return (
          <>
            <SmallMap currPoint={currPoint}/>
            {errMessage}
          </>
        )
      } else {
        let message;
  
        if(isInside && inRangePolygon) {
          message = (
            <>
              <p className='inline-block'>津波が浸水する恐れがあります。</p>
              <p>津波浸水深：{inRangePolygon.inRangePolygon.properties.A40_003}</p>
            </>
          )
        } else {
          message = (
            <>
              <p className='inline-block'>津波による危険は少ないとされています。<br/>※想定よりも大きい津波が来ることがございます。</p>
            </>
          );
        }
        return (
          <>
            <SmallMap currPoint={currPoint}/>
            {message}
          </>
        )
      } 
    }
};
export default Judgement;