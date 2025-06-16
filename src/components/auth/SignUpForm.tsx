"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { Sign } from "crypto";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { CiSettings } from "react-icons/ci";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheck,
  FaWrench,
  FaCog,
  FaPhone,
  FaFile
} from "react-icons/fa";
import { endpointUrl, httpPost } from "../../../helpers";
import FileInput from "../form/input/FileInput";
import { url } from "inspector";
import { set } from "lodash";

interface CreateData {
  name: string;
  email: string;
  password: string;
  phone: string;
  url_image: File | null;
}

const SignUpForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [urlImage, setUrlImage] = useState<File | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('a')
    e.preventDefault();
    if (!isChecked) {
      alert("Please agree to the terms and conditions.");
      toast.error("Please agree to the terms and conditions.");
      return;
    }
    if (!name || !email || !password || !phone) {
      alert("Please fill in all required fields.");
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      const data = new FormData();
      data.append("name", name);
      data.append("email", email);
      data.append("password", password);
      data.append("phone", phone);
      if (urlImage) {
        data.append("url_image", urlImage);
      }
      await httpPost(
        endpointUrl("/auth/create-user"),
        data,
        true,
      );
      toast.success("Account created successfully!");
      alert("Account created successfully!");
      window.location.href = "/signin";
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-h-screen w-full flex items-center justify-center bg-white to-zinc-900 px-4 relative overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_3px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_3px)] bg-[size:20px_20px]"></div>
      </div>
      <div className="relative w-full max-w-xl mt-5 max-h-screen">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-white-700/50 rounded-2xl shadow-2xl shadow-black/20 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 via-transparent to-slate-900/10 rounded-2xl"></div>

          <div className="absolute top-4 right-4 opacity-5">
            <FaCog className="w-24 h-24 text-orange-500 animate-spin" style={{ animationDuration: '20s' }} />
          </div>

          <div className="relative mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700  rounded-xl mb-4 shadow-lg relative">
              <FaWrench className="w-8 h-8 text-white" />
              <div className="absolute inset-0  from-white/20 to-transparent rounded-xl"></div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <span>Create Account</span>
              <CiSettings className="w-5 h-5 text-blue-400" />
            </h1>
            <p className="text-slate-400">
              Enter your details to get started!
            </p>
          </div>

          <div className="space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name<span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone<span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone"
                      className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white "
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password<span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-orange-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email<span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Profile Picture
                </label>
                <div className="relative">
                  {/* <FaFile className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" /> */}
                  <FileInput
                    onChange={(e) => setUrlImage(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-4 py-3 h-full bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 text-white custom-class" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-red-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-red-500/5 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setIsChecked(!isChecked)}
                    className={`w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 flex items-center justify-center ${isChecked
                      ? 'bg-blue-700 shadow-lg '
                      : ''
                      }`}
                  >
                    {isChecked && <FaCheck className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  By creating an account means you agree to the{" "}
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors">
                    Workshop Terms and Conditions
                  </span>
                  {" "}and our{" "}
                  <span className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition-colors">
                    Privacy Policy
                  </span>
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-700  hover:from-blue-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg  hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 flex items-center justify-center gap-2"
              >
                Register
              </button>
            </form>
          </div>
        </div>
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400 dark:text-gray-400">Already registered? </span>
          <Link href="/signin" className="text-blue-400 hover:text-blue-600 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );

}
export default SignUpForm;