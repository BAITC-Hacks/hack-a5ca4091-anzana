import { createFileRoute } from "@tanstack/react-router";
import { Deck } from "@/components/deck";

export const Route = createFileRoute("/")({
  component: Deck,
});
