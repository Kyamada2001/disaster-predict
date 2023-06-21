import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L,{ Icon } from "leaflet";
import Image from 'next/image'
import { renderToStaticMarkup } from "react-dom/server";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import useSWR from 'swr';
import { type } from 'os';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});
const Map = (props: any) => {
  const [evacuationPoints, setEvacuationPoints] = useState<GeoJSON.Feature[]>([]); // 避難所ポイント(動的)
  const mapRef = useRef(null);
  const [endMapLoad, setEndMapLoad] = useState(false)

  const iconUrl = "/evacuation_pin.png";
  const customIcon = new Icon({
    iconUrl: iconUrl,
    iconSize: [50, 50],
  });


  const fetcher = async(url: string) => {
    const response = await fetch(url)
    const data = await response.json();
    return data;
  }

  async function getEvacuationPoints (currBounds: any){
    // const {data, error} = useSWR('/points/evacuation.geojson', fetcher); useSWRを理解する必要がある
    const response = await fetch('/points/evacuation.geojson')
    const data = await response.json();
    if(!data) {
      return [];
    }
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
    return filteredPoints;
  }

  useEffect(() => {
    const map: any = mapRef.current;
    if (map && props.zoomCurr) {
      // map.setView([35.682839, 139.759455], 5); // 日本地図を全体表示
      map.flyTo(props.center, props.zoom); // 現在位置にズームして移動
    }
  },[endMapLoad]);

  // マップの操作を監視する
  function MapHandler () {
    setEndMapLoad(true)
    useMapEvents({
      moveend: handleMoveEnd,
    });
    return null;
  };

  const handleMoveEnd = async function handleMoveEnd(e: any){
    const map = e.target;

    const zoomLebel = map.getZoom();
    if(zoomLebel < 9) {
      setEvacuationPoints([])
      return null;
    };

    const bounds = map.getBounds();
    const data: any = await getEvacuationPoints(bounds);


    setEvacuationPoints(data);
  };

  return (
    <>
      <MapContainer
        center={[38.46, 137.36]}
        zoom={5}
        style={props.style ?? { height: "100vh", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html/" target="blank">OpenStreetMap</a> contributors'
          url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
        />
        <TileLayer
        attribution='&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html/" target="blank">OpenStreetMap</a> contributors'
          url="https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png"
          // TODO: ZOOMするとopacityをより透過させる
          opacity={0.9}
        />
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <Image src="/tsunami-usage-guide.jpg" alt="" className="w-28 lg:w-44" width={44}
        height={28}/>
          </div>
        </div>
        {
          props.markerON ?
          <Marker position={props.center ?? [34.6864, 135.52]}>
            <Popup>
              現在地
            </Popup>
          </Marker>
          : null
        }
        {
          evacuationPoints.map((point: any, index) => (
            <Marker
              key={index}
              icon={customIcon}
              position={[point.geometry.coordinates[0], point.geometry.coordinates[1]]}
            >
              <Popup>{point?.properties?.name}</Popup>
            </Marker>
          ))
        }
        <MapHandler/>
      </MapContainer>
    </>
  );
};

export default Map;