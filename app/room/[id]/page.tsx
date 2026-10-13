import { Suspense } from "react";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

async function RoomContent({ params }: RoomPageProps) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
      Room {id}
    </main>
  );
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-500">
          Loading board…
        </main>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}
