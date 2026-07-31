import { redirect } from "next/navigation";

export default function ChurchManagementTeamsPage() {
  redirect("/gestao-igreja/pessoas?panel=teams");
}
