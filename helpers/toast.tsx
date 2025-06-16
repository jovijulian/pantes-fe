import React from "react";
import toast from "react-hot-toast";

import { LiaTimesSolid } from "react-icons/lia";
import { BsInfoCircleFill } from "react-icons/bs";
import { TbAlertOctagonFilled } from "react-icons/tb";

export function alertToast(
  type: "success" | "info" | "warning" | "error",
  message = "",
  id = new Date().getTime().toString()
) {
  const content = (t: any) => (
    <span data-tag="alertoast" className="flex justify-between items-center">
      <span data-tag="alertoast">{message}</span>
      <button
        data-tag="alertoast"
        className="-mr-3 ml-4 px-0 py-0 text-lg leading-3"
        onClick={() => toast.dismiss(t.id)}
      >
        <LiaTimesSolid data-tag="alertoast" height={18} />
      </button>
    </span>
  );

  switch (type) {
    case "success":
      toast.success(content, { id });
      break;
    case "info":
      toast(content, {
        icon: (
          <BsInfoCircleFill
            data-tag="alertoast"
            className="text-xl text-blue-300 fill-current"
            height={18}
          />
        ),
        id,
      });
      break;
    case "warning":
      toast(content, {
        icon: (
          <TbAlertOctagonFilled
            data-tag="alertoast"
            className="text-xl fill-current text-amber-300"
            height={18}
          />
        ),
        id,
      });
      break;
    case "error":
      toast.error(content, {
        id: id,
        style: {
          background: "#c23616",
          color: "#fff",
        },
      });
      break;
    default:
      break;
  }
}
