import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import { Octokit } from "@octokit/rest";
import L, { polygon } from 'leaflet';
import AWS, { S3 } from 'aws-sdk';
import axios from 'axios';
import { ERROR_CODES, PrefectureCodes, STATUS_CODES } from '../../consts/codes';

type currPoint = {
  latitude: number,
  longitude: number,
}

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION // 例: 'us-east-1'
});

async function getGeoJSONFromS3(S3_fileName: String){
  console.log(S3_fileName)
  const S3_path = 'tsunami-polygons/tsunami-polygons/' + S3_fileName
  console.log(S3_path)
  const params: any = {
    Bucket: process.env.BACKET_NAME,
    Key: S3_path // バケット内のpath
  };

  try {
    const data = await s3.getObject(params).promise();
    const dataString = data.Body?.toString()

    if(dataString) {
      const dataObject = JSON.parse(dataString);
      return dataObject;
    } else {
      return null
    }
    
  } catch (error) {
    console.log(error)
    return null;
  }
}

const polygonFolder = "tsunami-polygons";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Object>
) {
  const currPoint: currPoint = req.body as currPoint;

  console.log(req.body)
  // 県情報を取得
  new Promise(async (resolve, reject) => {
    console.log(currPoint)
    const response = await fetch(`https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${currPoint.latitude}&lon=${currPoint.longitude}`);
    console.log("位置情報取得")
    const data = await response.json();
    console.log("データ取得")
    console.log(data)
    if (!data.results) {
      res.status(STATUS_CODES.BAD).json({
        error_code: ERROR_CODES.OUTSIDE_JAPAN
      });
    }
    resolve(data.results.muniCd);
  }).then(async (locationStr: any) => {
    // 現在地の都道府県コードを取得
    const prefectureCode: any = locationStr.substr(0, 2);

    if (!prefectureCode) {
      // 都道府県コードが見つからなかった場合のエラー
      res.status(STATUS_CODES.BAD).json({
        error_code: ERROR_CODES.PREFECTURE_NOT_FOUND,
      })
    }

    const S3_fileName: any= PrefectureCodes.filter((prefInfo) => {
      return prefInfo.code == prefectureCode
    })[0].S3_file;
    const domain = process.env.DOMAIN;
    const path = process.env.CLOUDFRONT_PATH;

    if(!S3_fileName) {
      // 国土数値情報サイトが公開していない場合
      res.status(STATUS_CODES.BAD).json({
        error_code: ERROR_CODES.POLYGONFILE_NOT_FOUND,
      })
    }

    console.log("S3バケット呼び出し")
    console.log(S3_fileName)
    const url = domain! + path! + S3_fileName;
    console.log(url)
    const response: any = await axios.get(url)
    console.log(response)
    const data: any = response.data;

    console.log(data)
    if(!data && !data.features) {
      res.status(STATUS_CODES.BAD).json({
        error_code: ERROR_CODES.SERVER_ERROR,
      })
    }
    // ポリゴンデータ
    const point = turf.point([currPoint.longitude, currPoint.latitude]);
    const inRangePolygon = data.features.find((feature: any) => {
      if (!feature.geometry) {
        return false;
      }
      // TODO: 海上など、到達予定だがポリゴン外の場合の処理
      // TODO: -simplifyによってできた穴に入った場合は考えられるか調べる
      return turf.booleanPointInPolygon(point, feature.geometry)
    });

    if (inRangePolygon) {
      res.status(200).json({ inRangePolygon });
    } else {
      res.status(200).json({ inRangePolygon: null });
    }
    // const polygonCollection: any = turf.featureCollection(polygonFeatures.features);
  }).catch((err) => {
    console.log(err)
    res.status(STATUS_CODES.BAD)
  })
}