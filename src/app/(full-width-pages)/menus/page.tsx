import Menus from "./menus";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menus | CRM Pantes Gold",
};

export default function MenusPage() {
  return <Menus />;
}
