import { PersonaPage } from "@/components/marketing/PersonaPage";
import { personaPages } from "@/features/marketing";

export default function FounderPersonaPage() {
  return <PersonaPage persona={personaPages.find((persona) => persona.slug === "founder") || personaPages[0]} />;
}
