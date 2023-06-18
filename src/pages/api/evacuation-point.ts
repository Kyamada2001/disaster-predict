import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path';
import fs from 'fs';
import { ERROR_CODES, STATUS_CODES } from '../../consts/codes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Object>
) {
    const currBounds = req.body;
    const FilePath = '/public/points/evacuation.geojson'
    const filePath = path.join(process.cwd(), FilePath);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const filteredPoints: any = [];
    data.features.filter((point: any) => {
        const pointCoordinates = point.geometry.coordinates;
        if (
            pointCoordinates[0] >= currBounds._southWest.lat &&
            pointCoordinates[0] <= currBounds._northEast.lat &&
            pointCoordinates[1] >= currBounds._southWest.lng &&
            pointCoordinates[1] <= currBounds._northEast.lng
          ) {
            filteredPoints.push(point);
          }
    });

    res.status(STATUS_CODES.SUCCESS).json({
        points: filteredPoints
    })
}