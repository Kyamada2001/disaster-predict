import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import L, { polygon } from 'leaflet';
import { ERROR_CODES, PrefectureCodes, STATUS_CODES } from '../../consts/codes';

type currPoint = {
  latitude: number, 
  longitude: number,
}

const polygonFolder = "tsunami-polygons";
  
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Object>
) {
    const currPoint: currPoint = req.body as currPoint;
    console.log(req.body)
    // 県情報を取得
    new Promise(async (resolve,reject) => {
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
    }).then((locationStr: any) => {
      // 現在地の都道府県コードを取得
      const prefectureCode: any = locationStr.substr(0,2);

      if(!prefectureCode) {
        // 都道府県コードが見つからなかった場合のエラー
        res.status(STATUS_CODES.BAD).json({
          error_code: ERROR_CODES.PREFECTURE_NOT_FOUND,
        })
      }
      const polygonFilesPath = path.join(process.cwd(), 'public', polygonFolder);

      let polygonFilePath: any = null;
      fs.readdir(polygonFilesPath, (err: any, files: any) => {
        if (err) throw err;
        
        files.forEach((file: string) => {
          const match: any = file.match(/_(\d+)\./);

          if (match) {
            const extractedNumber = match[1];
            if(extractedNumber == prefectureCode) {
              polygonFilePath = `/public/${polygonFolder}/${file}`;
            }
          }
        })
    
        // ファイルが見つからなかった場合のハンドリング(シェープファイルが公開されていない場合等)
        if(!polygonFilePath) {
          res.status(STATUS_CODES.BAD).json({
            error_code: ERROR_CODES.POLYGONFILE_NOT_FOUND,
          })
          return;
        }
        const filePath = path.join(process.cwd(), polygonFilePath);

        console.log("JsonFile")
        console.log(filePath)

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        console.log(data)
        
        const point = turf.point([currPoint.longitude, currPoint.latitude]);
        const inRangePolygon = data.features.find((feature: any) => {
          if(!feature.geometry) {
            return false;
          }
          // TODO: 海上など、到達予定だがポリゴン外の場合の処理
          // TODO: -simplifyによってできた穴に入った場合は考えられるか調べる
          return turf.booleanPointInPolygon(point, feature.geometry)
        });

        if(inRangePolygon) {
          res.status(200).json({inRangePolygon});
        }else {
          res.status(200).json({inRangePolygon: null});
        }
      })
      // const polygonCollection: any = turf.featureCollection(polygonFeatures.features);
    }).catch(() => {
      console.log("エラー：Hanlde")
    })
}