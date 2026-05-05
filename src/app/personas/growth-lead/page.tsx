import { PersonaPage } from "@/components/marketing/PersonaPage";
import { personaPages } from "@/features/marketing";

export default function GrowthLeadPersonaPage() {
  return <PersonaPage persona={personaPages.find((persona) => persona.slug === "growth-lead") || personaPages[0]} />;
}
