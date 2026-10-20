import { Suspense } from "react";
import { notFound } from "next/navigation";
import BoardLoader from "@/components/BoardLoader";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

const ROOM_ID = /^[A-Za-z0-9_-]{1,64}$/;

async function RoomContent({ params }: RoomPageProps) {
  const { id } = await params;
  if (!ROOM_ID.test(id)) notFound();
  return <BoardLoader roomId={id} />;
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh items-center justify-center text-neutral-500">Loading board…</main>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}
