import { redirect } from "next/navigation";

export default function ChurchQrCodesPage() {
  redirect("/gestao-igreja/pessoas?panel=invites");
}
