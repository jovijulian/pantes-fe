import Menus from "./menus";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menus | Pantes Gold App",
};

export default function MenusPage() {
  return <Menus />;
}
