"use client";
import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Image from "next/image";


export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  useEffect(() => {
    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    if (name) setUserName(name);
    if (email) setUserEmail(email);
  }, []);
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src="/images/default_profile.jpg"
                alt="user"
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {userName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>

              </div>
            </div>
           
          </div>
          
        </div>
      </div>
      
    </>
  );
}
