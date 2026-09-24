"use client";
import { useEffect, useState } from "react";
export function TeamPhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]);
  if (photoUrl && !failed)
    return (
      <img
        className="team-photo"
        src={photoUrl}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  return (
    <div className="team-photo team-initials" aria-label={name}>
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()}
    </div>
  );
}
