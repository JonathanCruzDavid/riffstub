"use client";

import { Suspense } from "react";
import AddPastConcertForm from "@/components/AddPastConcertForm";

export default function NewPastConcertPage() {
  return (
    <Suspense fallback={null}>
      <AddPastConcertForm />
    </Suspense>
  );
}
