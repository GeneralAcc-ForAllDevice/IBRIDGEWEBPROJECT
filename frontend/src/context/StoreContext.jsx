import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB per chunk (413 payload limit မမိစေရန်)
const CONCURRENCY = 2; // တစ်ပြိုင်နက် ပို့မည့် chunk အရေအတွက်

const toMB = (bytes = 0) => Number((bytes / (1024 * 1024)).toFixed(2));

const resolveApiUrl = (propUrl) => {
  if (propUrl) return propUrl;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
};

export const StoreContextProvider = (props) => {
  const url = resolveApiUrl(props.url);

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("role") || "user"
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || ""
  );
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Food / Product items list
  const [food_list, setFoodList] = useState([]);

  // Software items list
  const [software_list, setSoftwareList] = useState([]);

  // ဘယ် route ပြောင်းသွားသွား background မှာ ဆက် run နေမည့် upload state
  const [activeUpload, setActiveUpload] = useState({
    isUploading: false,
    fileName: "",
    mediaType: "video",
    totalMB: 0,
    uploadedMB: 0,
    remainingMB: 0,
    lastCompletedPost: null,
  });

  const isUploadingRef = useRef(false);

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data?.success) {
        setFoodList(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error("Error fetching food list:", error);
    }
  }, [url]);

  const fetchSoftwareList = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/software/list`);
      if (response.data?.success) {
        const list = Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data.softwares)
            ? response.data.softwares
            : Array.isArray(response.data.list)
              ? response.data.list
              : [];
        setSoftwareList(list);
      }
    } catch (error) {
      console.error("Error fetching software list:", error);
    }
  }, [url]);

  useEffect(() => {
    fetchFoodList();
    fetchSoftwareList();
  }, [fetchFoodList, fetchSoftwareList]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [role]);

  useEffect(() => {
    if (userName) {
      localStorage.setItem("userName", userName);
    } else {
      localStorage.removeItem("userName");
    }
  }, [userName]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);
  const startBackgroundUpload = useCallback(
    async ({
      file,
      author,
      userId,
      content,
      mediaType = "video",
      onSuccess,
    }) => {
      if (isUploadingRef.current) {
        toast.info("လက်ရှိ ဗီဒီယိုတစ်ခု Background မှာ တင်နေဆဲ ဖြစ်ပါသည်");
        return null;
      }

      isUploadingRef.current = true;
      const totalBytes = file ? file.size : 0;
      const totalMB = toMB(totalBytes);

      setActiveUpload({
        isUploading: true,
        fileName: file?.name || "Post",
        mediaType,
        totalMB,
        uploadedMB: 0,
        remainingMB: totalMB,
        lastCompletedPost: null,
      });

      const updateMB = (loadedBytes) => {
        const safeLoaded = Math.min(totalBytes, Math.max(0, loadedBytes));
        const upMB = toMB(safeLoaded);
        const remMB = toMB(Math.max(0, totalBytes - safeLoaded));
        setActiveUpload((prev) => ({
          ...prev,
          totalMB,
          uploadedMB: upMB,
          remainingMB: remMB,
        }));
      };

      try {
        let data;

        if (file && mediaType === "video") {
          const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE));
          const uploadId = `vid_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          let uploadedBytes = 0;

          const sendChunk = async (index) => {
            const start = index * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalBytes);
            const chunkSizeBytes = end - start;
            const blobChunk = file.slice(start, end);

            const chunkForm = new FormData();
            chunkForm.append("uploadId", uploadId);
            chunkForm.append("chunkIndex", String(index));
            chunkForm.append("totalChunks", String(totalChunks));
            chunkForm.append("chunk", blobChunk, `${file.name}.part${index}`);

            await axios.post(`${url}/api/post/upload-chunk`, chunkForm, {
              timeout: 0,
              headers: {
                ...(token ? { token } : {}),
              },
            });

            uploadedBytes += chunkSizeBytes;
            updateMB(uploadedBytes);
          };

          let nextIndex = 0;
          const workers = Array.from(
            { length: Math.min(CONCURRENCY, totalChunks) },
            async () => {
              while (nextIndex < totalChunks) {
                const currentIdx = nextIndex;
                nextIndex += 1;
                await sendChunk(currentIdx);
              }
            }
          );

          await Promise.all(workers);

          const completeRes = await axios.post(
            `${url}/api/post/upload-complete`,
            {
              uploadId,
              totalChunks,
              fileName: file.name,
              author,
              userId,
              content,
            },
            {
              timeout: 0,
              headers: {
                "Content-Type": "application/json",
                ...(token ? { token } : {}),
              },
            }
          );

          data = completeRes.data;
        } else {
          const formData = new FormData();
          formData.append("author", author);
          formData.append("userId", userId);
          formData.append("content", content);
          formData.append("mediaType", mediaType);
          if (file) {
            formData.append("media", file, file.name);
          }

          const response = await axios.post(`${url}/api/post/create`, formData, {
            timeout: 0,
            headers: {
              ...(token ? { token } : {}),
            },
            onUploadProgress: (progressEvent) => {
              const loaded = progressEvent.loaded || 0;
              const total = progressEvent.total || totalBytes || loaded;
              const upMB = toMB(loaded);
              const totMB = toMB(total);
              const remMB = toMB(Math.max(0, total - loaded));
              setActiveUpload((prev) => ({
                ...prev,
                totalMB: totMB,
                uploadedMB: upMB,
                remainingMB: remMB,
              }));
            },
          });

          data = response.data;
        }

        if (data?.success) {
          setActiveUpload((prev) => ({
            ...prev,
            uploadedMB: prev.totalMB,
            remainingMB: 0,
            lastCompletedPost: data.data || null,
          }));
          toast.success("Background upload ပြီးမြောက်ပါပြီ!");
          if (onSuccess && data.data) {
            onSuccess(data.data);
          }
          setTimeout(() => {
            setActiveUpload((prev) => ({
              ...prev,
              isUploading: false,
            }));
          }, 1200);
          return data.data;
        } else {
          toast.error(data?.message || "Post တင်၍မရပါ");
          setActiveUpload((prev) => ({
            ...prev,
            isUploading: false,
          }));
          return null;
        }
      } catch (error) {
        console.error("Background upload error:", error);
        const serverMsg =
          error?.response?.data?.message ||
          (error?.response?.status === 413
            ? "ဗီဒီယိုဖိုင် ဆိုဒ် ကြီးလွန်းနေပါသည် (413 Payload Too Large)"
            : "Background upload တွင် အမှားရှိပါသည်");
        toast.error(serverMsg);
        setActiveUpload((prev) => ({
          ...prev,
          isUploading: false,
        }));
        return null;
      } finally {
        isUploadingRef.current = false;
      }
    },
    [url, token]
  );

  const contextValue = {
    url,
    token,
    setToken,
    role,
    setRole,
    user,
    setUser,
    userName,
    setUserName,
    food_list,
    setFoodList,
    fetchFoodList,
    software_list,
    setSoftwareList,
    fetchSoftwareList,
    activeUpload,
    startBackgroundUpload,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;