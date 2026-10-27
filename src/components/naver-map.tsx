"use client";

import { useEffect, useRef, useState } from "react";
import { browserSdkLoader, sdkErrorMessage } from "@/lib/maps/sdk";
import { createMapController } from "@/lib/maps/controller";
import type { LocatedRestaurant } from "@/lib/maps/locations";

export function NaverMap({ restaurants, selected, onSelect, visible }: { restaurants: LocatedRestaurant[]; selected: string | null; onSelect: (id: string) => void; visible: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createMapController> | null>(null);
  const callback = useRef(onSelect);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const key = process.env.NEXT_PUBLIC_NAVER_MAPS_KEY_ID ?? "";
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let active = true;
    const loader = browserSdkLoader();
    const fail = (error: unknown) => {
      if (!active) return;
      controller.current?.destroy(); controller.current = null;
      setMessage(sdkErrorMessage(error)); setPhase("error");
    };
    const unsubscribe = loader.subscribe(fail);
    loader.load(key).then(sdk => {
      if (!active || !container.current) return;
      try {
        controller.current = createMapController(container.current, sdk, id => callback.current(id));
        setPhase("ready");
      } catch { fail(null); }
    }).catch(fail);
    return () => { active = false; unsubscribe(); controller.current?.destroy(); controller.current = null; };
  }, [key, attempt]);
  useEffect(() => { if (phase === "ready") { controller.current?.resize(); controller.current?.render(restaurants); } }, [restaurants, phase]);
  useEffect(() => { if (phase === "ready") controller.current?.select(selected); }, [selected, restaurants, phase]);
  useEffect(() => {
    const node = container.current;
    if (!node || phase !== "ready") return;
    const observer = new ResizeObserver(() => { controller.current?.resize(); controller.current?.select(selected); });
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase, selected, visible]);
  return <section aria-label="네이버 식당 지도" data-map-sdk-state={phase} data-map-marker-count={phase === "ready" ? restaurants.length : 0} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    {phase !== "ready" && <div role={phase === "error" ? "alert" : "status"} className="flex min-h-72 flex-col items-center justify-center gap-4 bg-surface px-6 py-12 text-center text-sm leading-7 text-slate-600"><p>{phase === "loading" ? "네이버 지도를 불러오는 중입니다…" : message}</p>{phase === "error" && <button type="button" className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-navy" onClick={() => { setMessage(""); setPhase("loading"); setAttempt(value => value + 1); }}>지도 다시 시도</button>}<p className="text-xs">지도 연결과 무관하게 식당 목록은 계속 이용할 수 있습니다.</p></div>}
    <div ref={container} data-naver-map-canvas aria-label="검증된 식당 위치" className={`h-[52vh] min-h-80 w-full lg:h-[68vh] ${phase === "ready" ? "" : "hidden"}`} />
    {phase === "ready" && <p className="border-t border-slate-100 px-4 py-3 text-xs leading-6 text-slate-500">위치 확인된 식당 {restaurants.length}곳만 표시합니다. 영업 여부를 의미하지 않습니다.</p>}
  </section>;
}
