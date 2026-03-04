import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function KursIndexRedirect() {
  // Falls /kurs ohne Slug aufgerufen wird, leiten wir auf die Kurs-Übersicht weiter,
  // damit kein leerer Slug eine 404 auslöst.
  redirect("/entdecken");
}
