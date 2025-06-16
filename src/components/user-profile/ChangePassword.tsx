"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal"; // Asumsi path ini benar
import { Modal } from "../ui/modal"; // Asumsi path ini benar
// import Button from "../ui/button/Button"; // Tidak lagi digunakan
import Input from "../form/input/InputField"; // Asumsi path ini benar
import Label from "../form/Label"; // Asumsi path ini benar
import { endpointUrl, httpPost } from "../../../helpers";
import toast from "react-hot-toast";
// Jika Anda ingin menggunakan FaEdit atau ikon serupa:
// import { FaLock, FaTimes, FaSave } from "react-icons/fa"; // Contoh ikon

export default function UserSecurityCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    const payload = {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    };


    try {
      await httpPost(endpointUrl("auth/update-password"), payload, true);
      toast.success("Berhasil ganti password!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      closeModal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
      setError(error?.response?.data?.message || "Failed to change password.");
    }


  };

  const UserDisplayInfo = () => (
    <>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Account Security
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Manage your account password.
      </p>
    </>
  );

  const handleCancel = () => {
    closeModal();
    setError("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <UserDisplayInfo />
        </div>

        <button
          onClick={openModal}
          title="Change Password"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 lg:inline-flex lg:w-auto transition-all"
        >
          <svg // Menggunakan SVG yang ada, atau ganti dengan <FaLock className="w-4 h-4" /> jika Anda import FaLock
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 11.853C12.0002 11.2378 11.7793 10.6468 11.3839 10.2023C10.9885 9.75789 10.4453 9.49981 9.86499 9.49981C9.28468 9.49981 8.74153 9.75789 8.34612 10.2023C7.95071 10.6468 7.72982 11.2378 7.72998 11.853C7.72998 12.882 8.01998 13.572 8.53998 14.202C8.75849 14.4753 9.02698 14.7003 9.33598 14.867C9.43998 14.926 9.55998 14.96 9.67998 14.994L9.68398 14.995C9.78983 15.0245 9.89839 15.0402 10.008 15.042H10.03C10.098 15.042 10.166 15.037 10.235 15.026C10.363 14.998 10.49 14.952 10.612 14.89C10.958 14.715 11.256 14.453 11.488 14.14C11.8834 13.5961 12.0002 12.9401 12 12.325V11.853ZM17 9.49981H16.27V7.34981C16.27 4.73881 14.421 2.49981 12 2.49981C9.579 2.49981 7.73 4.73881 7.73 7.34981V9.49981H7C6.586 9.49981 6.25 9.83581 6.25 10.2498V19.2498C6.25 19.6638 6.586 19.9998 7 19.9998H17C17.414 19.9998 17.75 19.6638 17.75 19.2498V10.2498C17.75 9.83581 17.414 9.49981 17 9.49981ZM9.20998 7.34981C9.20998 5.56481 10.428 4.07081 12 4.07081C13.572 4.07081 14.79 5.56481 14.79 7.34981V9.49981H9.20998V7.34981Z"
              fill="currentColor"
            />
          </svg>
          Change Password
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="pr-10">
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
              Change Password
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Enter your old password and set a new strong password.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword();
            }}
            className="flex flex-col"
          >
            <div className="space-y-5 px-2 pb-3">
              <div>
                <Label htmlFor="old_password">Old Password</Label>
                <Input
                  type="password"
                  id="old_password"
                  name="old_password"
                  defaultValue={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  type="password"
                  id="new_password"
                  name="new_password"
                  defaultValue={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  defaultValue={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                title="Cancel"
                onClick={handleCancel}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
              >
                {/* <FaTimes className="w-4 h-4 mr-2" /> // Contoh dengan ikon */}
                Cancel
              </button>
              <button
                type="submit"
                title="Save Password"
                className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all"
              >
                {/* <FaSave className="w-4 h-4 mr-2" /> // Contoh dengan ikon */}
                Save Password
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}