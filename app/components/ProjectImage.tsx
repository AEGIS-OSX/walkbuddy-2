"use client";
import assets from "../../public/assets.json";

type AssetKey = keyof typeof assets;

export function ProjectImage({ id, className }: { id: AssetKey; className?: string }) {
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
    />
  );
}
