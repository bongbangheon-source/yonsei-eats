"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mapUrl } from "@/lib/maps/state";

export function ViewLink({ target }: { target: "/" | "/map" }) {
  const params = useSearchParams();
  return <Link data-view-link={target} href={mapUrl(target, { q: params.get("q") ?? "", category: params.get("category") ?? "" })} className="inline-flex min-h-11 items-center rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-navy">{target === "/map" ? "지도 보기" : "식당 탐색"}</Link>;
}
