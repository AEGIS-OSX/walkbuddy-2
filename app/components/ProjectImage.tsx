"use client";

import type { CSSProperties } from "react";
import assets from "../../public/assets.json";

type AssetKey = keyof typeof assets;

type ProjectImageProps = {
  id: AssetKey;
  className?: string;
  fetchpriority?: "high" | "low" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  style?: CSSProperties;
};

export function ProjectImage({ id, className, fetchpriority, fetchPriority, style }: ProjectImageProps) {
  const asset = assets[id];

  if (!asset?.url) return null;

  return (
    <img
      src={asset.url}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      className={className}
      loading={id === "hero" ? "eager" : "lazy"}
      fetchPriority={fetchPriority ?? fetchpriority}
      style={style}
    />
  );
}
