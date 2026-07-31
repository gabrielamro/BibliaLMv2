import { redirect } from "next/navigation";

export default function ChurchManagementPermissionsPage() {
  redirect("/gestao-igreja/pessoas?panel=permissions");
}
