import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Singup | Bacip Moto",

};

export default function SignUp() {
  return <SignUpForm />;
}
