import type { NaverMaps, SdkHost } from "./naver-types.ts";

export class MapSdkError extends Error {
  code: "missing-key" | "auth" | "network" | "timeout";
  constructor(code: MapSdkError["code"]) { super(code); this.code = code; }
}

export function createSdkLoader(host: SdkHost, doc: Document, timeoutMs = 15000) {
  let promise: Promise<NaverMaps> | null = null;
  let script: HTMLScriptElement | null = null;
  let failed = false;
  let generation = 0;
  const subscribers = new Set<(error: MapSdkError) => void>();
  let rejectPending: ((error: MapSdkError) => void) | null = null;
  const fail = (code: MapSdkError["code"], attempt: number) => {
    if (attempt !== generation || failed) return;
    failed = true;
    const error = new MapSdkError(code);
    rejectPending?.(error);
    promise = null;
    subscribers.forEach(callback => callback(error));
  };
  return {
    subscribe(callback: (error: MapSdkError) => void) { subscribers.add(callback); return () => { subscribers.delete(callback); }; },
    load(rawKey: string): Promise<NaverMaps> {
      const key = rawKey.trim();
      if (!key || !/^[A-Za-z0-9_-]{1,128}$/.test(key) || /^sb_/.test(key)) return Promise.reject(new MapSdkError("missing-key"));
      if (promise) return promise;
      if (!failed && host.naver?.maps?.Map) return Promise.resolve(host.naver.maps);
      script?.remove();
      failed = false;
      const attempt = ++generation;
      host.navermap_authFailure = () => fail("auth", attempt);
      promise = new Promise<NaverMaps>((resolve, reject) => {
        const timer = setTimeout(() => fail("timeout", attempt), timeoutMs);
        rejectPending = error => { clearTimeout(timer); rejectPending = null; reject(error); };
        script = doc.createElement("script");
        script.async = true;
        script.referrerPolicy = "strict-origin-when-cross-origin";
        script.dataset.yonseiMapsSdk = "true";
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}`;
        script.onload = () => {
          if (failed || attempt !== generation) return;
          clearTimeout(timer);
          rejectPending = null;
          if (!host.naver?.maps?.Map) { fail("network", attempt); reject(new MapSdkError("network")); return; }
          resolve(host.naver.maps);
        };
        script.onerror = () => fail("network", attempt);
        doc.head.appendChild(script);
      });
      return promise;
    },
  };
}

let loader: ReturnType<typeof createSdkLoader> | null = null;
export function browserSdkLoader() {
  loader ??= createSdkLoader(window as unknown as SdkHost, document);
  return loader;
}

export function sdkErrorMessage(error: unknown): string {
  const code = error instanceof MapSdkError ? error.code : "network";
  if (code === "missing-key") return "지도 API 키가 설정되지 않았습니다. NAVER Maps 공개 Key ID 설정을 확인해 주세요.";
  if (code === "auth") return "네이버 지도 인증에 실패했습니다. 공개 Key ID·Web 서비스 URL·Web Dynamic Map 사용 설정을 확인해 주세요.";
  if (code === "timeout") return "지도 응답 시간이 초과되었습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.";
  return "네이버 지도를 불러오지 못했습니다. 네트워크 또는 콘텐츠 차단 설정을 확인해 주세요.";
}
