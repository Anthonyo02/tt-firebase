"use client";

import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

const cache = createCache({ key: "mui", prepend: true });

export default function EmotionCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
