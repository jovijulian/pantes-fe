"use client";
import React, { useEffect, useState } from "react";
import { IconEye, IconEyeOff, IconMail, IconMessage, IconStar } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import { Root } from "@/types";
import { useForm } from "@mantine/form";
import { endpointUrl, endpointUrlv2, httpGet } from "@/../helpers";
import { BiSolidCarMechanic } from "react-icons/bi";

import useLocalStorage from "@/hooks/useLocalStorage";
import { setCookie } from "cookies-next";
import Alert from "@/components/ui/alert/Alert";
import axios from "axios";
import { AtSign, Eye, EyeOff, IdCard, Key, Loader2, Mail } from "lucide-react";

const SignIn: React.FC = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [_, setToken] = useLocalStorage("token", "");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ variant: any; title: string; message: string; showLink: boolean; linkHref: string; linkText: string } | null>(null);


  
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      password: (value: any) =>
        value.length < 6
          ? "Password should include at least 6 characters"
          : null,
    },
  });

  const onSubmit = async (payload: typeof form.values) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await axios<Root>({
        method: "POST",
        url: endpointUrl(`auth/login`),
        data: {
          email: form.values.email,
          password: form.values.password,
        },
      });

      const { token } = response.data.data;
      localStorage.setItem("token", token);
      setCookie("cookieKey", token, {});
      getMe();
    } catch (error: any) {
      if (error.response.status === 401) {
        setAlert({
          variant: "error",
          title: "Fail to Login",
          message: "Email or Password is incorrect.",
          showLink: false,
          linkHref: "",
          linkText: "",
        });
        return;
      }
      setAlert({
        variant: "error",
        title: "Fail to Login",
        message: "Internal Server Error.",
        showLink: false,
        linkHref: "",
        linkText: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMe = async () => {
    try {
      const response = await httpGet(endpointUrl(`auth/me`), true);
      const user = response.data.data;
      setCookie("role", user.role_id, {});
      localStorage.setItem("role", user.role_id);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("id", user.id);
      window.location.href = "/";

    } catch (error) {
      console.log(error);
    }
  };
 

  const renderAccountForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input {...form.getInputProps("email")} type="text" placeholder="john@example.com" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input {...form.getInputProps("password")} type={isPasswordVisible ? "text" : "password"} placeholder="Enter password" className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
            {isPasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <Link href="/" className="flex items-center">
              <span className="text-gray-800 dark:text-white font-bold text-xl sm:text-2xl">CRM Pantes Gold</span>
            </Link>
            <h1 className="font-bold text-2xl text-slate-800 mt-4">Log in</h1>
            <p className="text-slate-500 text-sm">Please log in using your registered account.</p>
          </div>

          <form onSubmit={form.onSubmit(onSubmit)} className="space-y-5">
            {renderAccountForm()}
            {alert && (
              <Alert variant={alert.variant} title={alert.title} message={alert.message} showLink={false} linkHref="" linkText="" />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-blue-300"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>
        </div>

        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center relative p-5">
          <Image src="/images/pantes-logo.png" alt="Illustration of general affair" fill style={{ objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
