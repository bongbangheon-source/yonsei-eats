// Minimal public API surface used by this app, checked against NAVER v3 docs.
export interface MapInstance { panTo(position: object): void; fitBounds(bounds: object): void; setSize(size: { width: number; height: number }): void; destroy(): void }
export interface MarkerInstance { setMap(map: MapInstance | null): void }
export interface InfoInstance { open(map: MapInstance, marker: MarkerInstance): void; close(): void }
export interface NaverMaps {
  Map: new (element: HTMLElement, options?: Record<string, unknown>) => MapInstance;
  Marker: new (options: Record<string, unknown>) => MarkerInstance;
  InfoWindow: new (options: { content: HTMLElement; maxWidth?: number }) => InfoInstance;
  LatLng: new (latitude: number, longitude: number) => object;
  LatLngBounds: new (southwest: object, northeast: object) => object;
  Event: { addListener(target: object, event: string, callback: () => void): object; removeListener(listener: object): void; trigger(target: object, name: string): void };
}
export interface SdkHost { naver?: { maps: NaverMaps }; navermap_authFailure?: () => void }
