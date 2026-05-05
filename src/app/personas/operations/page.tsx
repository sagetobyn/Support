import { PersonaPage } from "@/components/marketing/PersonaPage";
import { personaPages } from "@/features/marketing";

export default function OperationsPersonaPage() {
  return <PersonaPage persona={personaPages.find((persona) => persona.slug === "operations") || personaPages[0]} />;
}
