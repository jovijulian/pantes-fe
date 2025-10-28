import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin | Pantes Gold App",
};

export default function SignIn() {
  return <SignInForm />;
}
