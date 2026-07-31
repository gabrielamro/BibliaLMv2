import { redirect } from "next/navigation";

export default function ChurchVolunteerPipelineRoute() {
  redirect("/gestao-igreja/pessoas?panel=volunteers");
}
