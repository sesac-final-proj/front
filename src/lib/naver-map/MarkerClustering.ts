/**
 * NAVER Maps JavaScript API v3 MarkerClustering (TypeScript Port)
 * 
 * 네이버 지도 오픈소스 marker-tools의 MarkerClustering 알고리즘을 TypeScript로 구현한 모듈입니다.
 */

export interface ClusterIconOptions {
  content: HTMLElement | string;
  size?: { width: number; height: number };
  anchor?: { x: number; y: number };
}

export interface MarkerClusteringOptions {
  map: any;
  markers?: any[];
  disableClickZoom?: boolean;
  minClusterSize?: number;
  maxZoom?: number;
  gridSize?: number;
  averageCenter?: boolean;
  icons?: ((count: number) => ClusterIconOptions) | ClusterIconOptions[];
  indexGenerator?: number[] | ((count: number) => number);
  stylingFunction?: (clusterMarker: any, count: number) => void;
  onClusterClick?: (cluster: Cluster, markers: any[]) => void;
  overlapThreshold?: number; // 교집합 기준 비율 (기본값 0.8: 80% 이상 겹치면 클러스터링)
}

export class Cluster {
  private _clusterer: MarkerClustering;
  private _map: any;
  private _gridSize: number;
  private _minClusterSize: number;
  private _disableClickZoom: boolean;
  private _averageCenter: boolean;

  private _center: any = null;
  private _markers: any[] = [];
  private _clusterMarker: any = null;
  private _clusterListener: any = null;

  constructor(clusterer: MarkerClustering) {
    this._clusterer = clusterer;
    this._map = clusterer.getMap();
    this._gridSize = clusterer.getGridSize();
    this._minClusterSize = clusterer.getMinClusterSize();
    this._disableClickZoom = clusterer.getDisableClickZoom();
    this._averageCenter = clusterer.getAverageCenter();
  }

  getCenter(): any {
    return this._center;
  }

  getBounds(): any {
    const naverMaps = (window as any).naver?.maps;
    if (!naverMaps) return null;

    if (!this._center) return null;
    const proj = this._map.getProjection();
    const point = proj.fromCoordToOffset(this._center);
    const halfGrid = this._gridSize / 2;

    const swPoint = new naverMaps.Point(point.x - halfGrid, point.y + halfGrid);
    const nePoint = new naverMaps.Point(point.x + halfGrid, point.y - halfGrid);

    return new naverMaps.LatLngBounds(
      proj.fromOffsetToCoord(swPoint),
      proj.fromOffsetToCoord(nePoint)
    );
  }

  getCount(): number {
    return this._markers.length;
  }

  getMarkers(): any[] {
    return this._markers;
  }

  getClusterMarker(): any {
    return this._clusterMarker;
  }

  isInBounds(latLng: any): boolean {
    const bounds = this.getBounds();
    return bounds ? bounds.hasLatLng(latLng) : false;
  }

  addMarker(marker: any): void {
    if (this._isMarkerAlreadyAdded(marker)) return;

    this._markers.push(marker);
    this._updateCenter();
  }

  destroy(): void {
    if (this._clusterListener && (window as any).naver?.maps?.Event) {
      (window as any).naver.maps.Event.removeListener(this._clusterListener);
      this._clusterListener = null;
    }
    if (this._clusterMarker) {
      this._clusterMarker.setMap(null);
      this._clusterMarker = null;
    }
    this._markers = [];
    this._center = null;
  }

  update(): void {
    const count = this.getCount();
    const naverMaps = (window as any).naver?.maps;

    if (count < this._minClusterSize) {
      this._hideClusterMarker();
      this._showIndividualMarkers();
      return;
    }

    this._hideIndividualMarkers();
    this._showClusterMarker();
  }

  private _isMarkerAlreadyAdded(marker: any): boolean {
    return this._markers.includes(marker);
  }

  private _updateCenter(): void {
    const naverMaps = (window as any).naver?.maps;
    if (!naverMaps || this._markers.length === 0) return;

    if (!this._averageCenter) {
      this._center = this._markers[0].getPosition();
      return;
    }

    let latSum = 0;
    let lngSum = 0;
    for (const marker of this._markers) {
      const pos = marker.getPosition();
      latSum += pos.lat();
      lngSum += pos.lng();
    }
    this._center = new naverMaps.LatLng(latSum / this._markers.length, lngSum / this._markers.length);
  }

  private _showIndividualMarkers(): void {
    for (const marker of this._markers) {
      if (marker.getMap() !== this._map) {
        marker.setMap(this._map);
      }
    }
  }

  private _hideIndividualMarkers(): void {
    for (const marker of this._markers) {
      if (marker.getMap() !== null) {
        marker.setMap(null);
      }
    }
  }

  private _showClusterMarker(): void {
    const naverMaps = (window as any).naver?.maps;
    if (!naverMaps || !this._center) return;

    const count = this.getCount();
    const iconConfig = this._clusterer.getIconForCount(count);

    if (!this._clusterMarker) {
      this._clusterMarker = new naverMaps.Marker({
        position: this._center,
        map: this._map,
        icon: iconConfig,
        zIndex: 200,
      });

      this._clusterListener = naverMaps.Event?.addListener(this._clusterMarker, "click", () => {
        this._clusterer.onClusterClicked(this);
      });
    } else {
      this._clusterMarker.setPosition(this._center);
      this._clusterMarker.setIcon(iconConfig);
      if (this._clusterMarker.getMap() !== this._map) {
        this._clusterMarker.setMap(this._map);
      }
    }
  }

  private _hideClusterMarker(): void {
    if (this._clusterMarker) {
      this._clusterMarker.setMap(null);
    }
  }
}

export class MarkerClustering {
  private _map: any;
  private _markers: any[] = [];
  private _clusters: Cluster[] = [];
  private _minClusterSize: number = 2;
  private _maxZoom: number = 18;
  private _gridSize: number = 70;
  private _averageCenter: boolean = true;
  private _disableClickZoom: boolean = true;
  private _icons?: ((count: number) => ClusterIconOptions) | ClusterIconOptions[];
  private _onClusterClick?: (cluster: Cluster, markers: any[]) => void;
  private _overlapThreshold: number = 0.8; // 80% 기준

  private _listeners: any[] = [];

  constructor(options: MarkerClusteringOptions) {
    this._map = options.map;
    this._markers = options.markers || [];
    this._minClusterSize = options.minClusterSize ?? 2;
    this._maxZoom = options.maxZoom ?? 18;
    this._gridSize = options.gridSize ?? 70;
    this._averageCenter = options.averageCenter ?? true;
    this._disableClickZoom = options.disableClickZoom ?? true;
    this._icons = options.icons;
    this._onClusterClick = options.onClusterClick;
    this._overlapThreshold = options.overlapThreshold ?? 0.8;

    this._initListeners();
    this._createClusters();
  }

  getMap(): any { return this._map; }
  getGridSize(): number { return this._gridSize; }
  getMinClusterSize(): number { return this._minClusterSize; }
  getAverageCenter(): boolean { return this._averageCenter; }
  getDisableClickZoom(): boolean { return this._disableClickZoom; }

  setMap(map: any): void {
    this._map = map;
    if (!map) {
      this.clear();
      this._removeListeners();
    } else {
      this._initListeners();
      this._createClusters();
    }
  }

  setMarkers(markers: any[]): void {
    this._clearClusters();
    this._markers = markers;
    this._createClusters();
  }

  getMarkers(): any[] {
    return this._markers;
  }

  getClusters(): Cluster[] {
    return this._clusters;
  }

  onClusterClicked(cluster: Cluster): void {
    if (this._onClusterClick) {
      this._onClusterClick(cluster, cluster.getMarkers());
    }
    if (!this._disableClickZoom && this._map) {
      const bounds = cluster.getBounds();
      if (bounds) {
        this._map.fitBounds(bounds);
      }
    }
  }

  getIconForCount(count: number): any {
    if (typeof this._icons === "function") {
      return this._icons(count);
    }
    if (Array.isArray(this._icons) && this._icons.length > 0) {
      const index = Math.min(Math.floor(count / 10), this._icons.length - 1);
      return this._icons[index];
    }

    // 기본 주황색(#ff6f0f) 원형 클러스터 아이콘 생성
    const size = count >= 50 ? 42 : count >= 10 ? 36 : 30;
    const fontSize = count >= 50 ? 15 : count >= 10 ? 14 : 13;

    return {
      content: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: #ff6f0f;
          color: #FFFFFF;
          border: 2px solid rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          font-weight: 700;
          font-size: ${fontSize}px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          user-select: none;
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">${count}</div>
      `,
      anchor: (window as any).naver?.maps?.Point
        ? new (window as any).naver.maps.Point(size / 2, size / 2)
        : { x: size / 2, y: size / 2 },
    };
  }

  clear(): void {
    this._clearClusters();
    for (const marker of this._markers) {
      marker.setMap(null);
    }
    this._markers = [];
  }

  private _clearClusters(): void {
    for (const cluster of this._clusters) {
      cluster.destroy();
    }
    this._clusters = [];
  }

  private _createClusters(): void {
    if (!this._map) return;

    const currentZoom = this._map.getZoom();
    if (currentZoom > this._maxZoom) {
      for (const marker of this._markers) {
        if (marker.getMap() !== this._map) marker.setMap(this._map);
      }
      return;
    }

    this._clearClusters();

    const proj = this._map.getProjection ? this._map.getProjection() : null;
    const n = this._markers.length;
    if (n === 0) return;

    if (!proj) {
      // 투영 정보가 없을 때는 기존 바운드 방식 fallback
      for (const marker of this._markers) {
        const position = marker.getPosition();
        let addedToCluster = false;
        for (const cluster of this._clusters) {
          if (cluster.isInBounds(position)) {
            cluster.addMarker(marker);
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          const cluster = new Cluster(this);
          cluster.addMarker(marker);
          this._clusters.push(cluster);
        }
      }
    } else {
      // 화면 픽셀 좌표 기준 Bounding Box 생성 및 교집합 80% 클러스터링
      const boxes = this._markers.map((marker) => {
        const point = proj.fromCoordToOffset(marker.getPosition());
        const width = 110;
        const height = 28;
        return {
          left: point.x - width / 2,
          right: point.x + width / 2,
          top: point.y - height / 2,
          bottom: point.y + height / 2,
          width,
          height,
          area: width * height,
          cx: point.x,
          cy: point.y,
        };
      });

      const parent = Array.from({ length: n }, (_, idx) => idx);
      const find = (i: number): number => {
        if (parent[i] === i) return i;
        return (parent[i] = find(parent[i]));
      };
      const union = (i: number, j: number) => {
        const rI = find(i);
        const rJ = find(j);
        if (rI !== rJ) parent[rI] = rJ;
      };

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const bA = boxes[i];
          const bB = boxes[j];
          const interW = Math.max(0, Math.min(bA.right, bB.right) - Math.max(bA.left, bB.left));
          const interH = Math.max(0, Math.min(bA.bottom, bB.bottom) - Math.max(bA.top, bB.top));
          const interArea = interW * interH;
          const minArea = Math.min(bA.area, bB.area);
          const ratio = interArea / minArea;
          const dist = Math.hypot(bA.cx - bB.cx, bA.cy - bB.cy);

          // 교집합 비율 80% (0.80) 이상이거나 거리가 14px 이하로 인접한 경우 클러스터 병합
          if (ratio >= this._overlapThreshold || dist <= 14) {
            union(i, j);
          }
        }
      }

      const clusterGroupMap = new Map<number, any[]>();
      for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!clusterGroupMap.has(root)) clusterGroupMap.set(root, []);
        clusterGroupMap.get(root)!.push(this._markers[i]);
      }

      clusterGroupMap.forEach((markers) => {
        const cluster = new Cluster(this);
        markers.forEach((m) => cluster.addMarker(m));
        this._clusters.push(cluster);
      });
    }

    for (const cluster of this._clusters) {
      cluster.update();
    }
  }

  private _initListeners(): void {
    const naverMaps = (window as any).naver?.maps;
    if (!naverMaps?.Event || !this._map) return;

    const listener = naverMaps.Event.addListener(this._map, "idle", () => {
      this._createClusters();
    });
    this._listeners.push(listener);
  }

  private _removeListeners(): void {
    const naverMaps = (window as any).naver?.maps;
    if (!naverMaps?.Event) return;

    for (const listener of this._listeners) {
      naverMaps.Event.removeListener(listener);
    }
    this._listeners = [];
  }
}
