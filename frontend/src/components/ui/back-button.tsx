'use client';

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className="gap-2"
      onClick={() => router.back()}
    >
      <ChevronLeft className="h-4 w-4" />
      Voltar
    </Button>
  );
}
