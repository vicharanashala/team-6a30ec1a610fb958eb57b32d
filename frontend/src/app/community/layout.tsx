import type { Metadata } from "next";
import "./forum.css";

export const metadata: Metadata = {
  title: "Community — Samagama",
  description: "Community discussion forum.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
