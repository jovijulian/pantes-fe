"use client";
import React, { useState } from "react";
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
import { useParams } from 'next/navigation';
import { Metadata } from "next";
import { toast } from "react-toastify";
import { FaCog, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser, FaWrench } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";
import { jwtDecode } from "jwt-decode";

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
      email: (value: any) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
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
          ...payload,
          user_agent: navigator.userAgent,
        },
      });

      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      setCookie("cookieKey", token, {});
      getMe();
    } catch (error) {
      console.log(error);
      setAlert({
        variant: "error",
        title: "Login Gagal",
        message: "Email atau password salah.",
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
      localStorage.setItem("role", user.role_id);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("user_id", user.id);

      setCookie("role", user.role_id);

      if (user.role_id == 1) {
        window.location.href = "/";
      } else if (user.role_id == 2) {
        window.location.href = "/mechanic-transaction";
      } else if (user.role_id == 3) {
        window.location.href = "/";
      }
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_3px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_3px)] bg-[size:20px_20px]"></div>
      </div>

      <div className="relative w-full max-w-md ">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 via-transparent to-slate-900/10 rounded-2xl"></div>

          <div className="absolute top-4 right-4 opacity-5">
            <FaCog className="w-24 h-24 text-orange-500 animate-spin" style={{ animationDuration: '20s' }} />

          </div>

          <div className="relative mb-8 text-center">
            <div className="inline-flex items-center justify-center w-60 h-40 rounded-xl relative">
              {/* <FaWrench className="w-8 h-8 text-white" /> */}
              <Image
                // className="w-8 h-8"
                src="/images/logo/logo-bacip.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </div>
            {/* <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <span>Bacip Moto</span>
              <CiSettings className="w-5 h-5 text-blue-400" />
            </h1> */}
            <p className="text-slate-400">
              Please sign in to continue!
            </p>
          </div>

          <div className="space-y-6">
            <form onSubmit={form.onSubmit(onSubmit)} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email<span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    {...form.getInputProps("email")}
                    type="email"
                    name="email"
                    // value={formData.email}
                    // onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password<span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    {...form.getInputProps("password")}
                    // value={formData.password}
                    // onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white "
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                  >
                    {isPasswordVisible ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-orange-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              {alert && (
                <div className="mb-3">
                  <Alert
                    variant={alert.variant}
                    title={alert.title}
                    message={alert.message}
                    showLink={alert.showLink}
                    linkHref={alert.linkHref}
                    linkText={alert.linkText}
                  />
                </div>
              )}

              <button
                type="submit"

                className={`w-full py-3 px-4 bg-blue-700  hover:from-blue-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg  hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center gap-2 ${loading ? 'opacity-80' : ''}`}
              >
                {loading ? (
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

        </div>
        {/* <div className="mt-6 text-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Don't have an account? </span>
          <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
            Sign Up
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default SignIn;
