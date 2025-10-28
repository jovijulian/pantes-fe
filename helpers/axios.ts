import axios, { AxiosError, AxiosResponse } from "axios";
import { alertToast } from "@/../helpers";
import Router from "next/router";
import { http, https } from "follow-redirects";
import toast from "react-hot-toast";
import { deleteCookie } from "cookies-next";

axios.defaults.withCredentials = false;

const config = {
  timeout: 60000,
  maxRedirects: 100,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
};

export function endpointUrl(url = "") {
  return `${process.env.BASE_URL}${url.toString().replace(/^\//g, "")}`;
}
export function endpointUrlv2(url = "") {
  return `${process.env.BASE_URL_DEV}${url.toString().replace(/^\//g, "")}`;
}
export function endpointUrlv2Cetak(url = "", appendToken = false) {
  let fullUrl = `${process.env.BASE_URL_V2}${url.toString().replace(/^\//g, "")}`;
  if (appendToken) {
    const token = localStorage.getItem("token");
    fullUrl += `${url.includes("?") ? "&" : "?"}token=${token}`;
  }
  return fullUrl;
}

const axiosInstance = axios.create(config);
axiosInstance.defaults.maxRedirects = 0; // Set to 0 to prevent automatic redirects

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const trace = error?.response?.data?.errors?.trace || [];
    const isTokenExpired = trace.includes("Token has expired") || trace.includes("Wrong number of segments");
    console.log(isTokenExpired)
    if (isTokenExpired) {
      toast.error("Session has expired. Please log back in.");
      localStorage.clear();
      deleteCookie("cookieKey");
      deleteCookie("role");
      window.location.href = "/signin";
      document.cookie = "cookieKey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
     return;
    }
    if (error.response && [301, 302].includes(error.response.status)) {
      console.log("Redirecting to", error.response.headers.location);
      const redirectUrl = error.response.headers.location;
      return axiosInstance.get(redirectUrl);
    }
    return Promise.reject(error);
  }
);

function httpGet(url: string, withAuth = false, params = {}, configs = {}) {
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance.get(url, {
    ...{ ...config, ...configs },
    params,
  });
}

function httpGetV2<T>(
  url: string,
  withAuth = false,
  params: { [key: string]: any } = {},
  configs: { [key: string]: any } = {}
): Promise<AxiosResponse<T, any>> {
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance.get<T>(url, {
    ...{ ...config, ...configs },
    params,
  });
}

const httpPost = (url: string, data: any, withAuth = false, configs = {}) => {
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance.post(url, data, {
    ...{ ...config, ...configs },
  });
};

const httpPut = (url: string, data: any, withAuth = false, configs = {}) => {
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance.put(url, data, {
    ...{ ...config, ...configs },
  });
};

export const httpPutV2 = async (url: string, withAuth = false, data = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (withAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return axios.put(url, data, { headers });
};
const httpPatch = (url: string, data: any, withAuth = false, configs = {}) => {
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  return axiosInstance.patch(url, data, {
    ...{ ...config, ...configs },
  });
};
function httpDelete(url: string, withAuth = false, params = {}, configs = {}) {
  
  if (withAuth) {
    axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + localStorage.getItem("token");
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
  
  return axiosInstance.delete(url, {
    ...{ ...config, ...configs },
    params,
  });
}

// const handleNetworkError = (response: AxiosError) => {
//   return (
//     (ty(response, "name").safeString == "Error" || ty(response, "name").safeString == "AxiosError") &&
//     (ty(response, "message").safeString.includes("timeout of") || ty(response, "message").safeString.includes("Network Error"))
//   );
// };

// const handleServerError = (response: AxiosError) => {
//   return ty(response, "response.status").safeNumber == 500;
// };

// const handleUnauthorized = (response: AxiosError) => {
//   return ty(response, "response.status").safeNumber == 401;
// };

// const handleNotFound = (response: AxiosError) => {
//   if (ty(response, "response.status").safeNumber == 404) {
//    Router.push("/404");
//    return true;
//   }
//   return false;
// };

const redirectAuth = (redirecting = false) => {
  const redirectDest = "/login";
  // const refferer = Router.asPath == "/" || Router.asPath.includes("/login") ? false : { ref: Router.asPath };
  if (redirecting) {
    Router.replace({
      pathname: redirectDest,
      // query: refferer,
    });
  }
};



export default axiosInstance;
export {
  httpGet,
  httpGetV2,
  httpPut,
  httpPatch,
  httpPost,
  httpDelete,
};
