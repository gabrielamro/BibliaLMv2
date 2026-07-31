import { redirect } from "next/navigation";

export default function ChurchManagementAssignmentsPage() {
  redirect("/gestao-igreja/pessoas?panel=assignments");
}
