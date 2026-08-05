"use client";

import { Suspense } from "react";
import AddUpcomingConcertForm from "@/components/AddUpcomingConcertForm";

export default function NewConcertPage() {
  return (
    <Suspense fallback={null}>
      <AddUpcomingConcertForm />
    </Suspense>
  );
}
