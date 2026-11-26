import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./GlobalVideoCall.css";

const formatMediaError = (err) => {
  const isSecure = typeof window !== "undefined" ? window.isSecureContext : false;
  if (!isSecure || err?.message === "HTTPS_REQUIRED") {
    return `HTTP IP (${window.location.hostname}) ဖြင့် ဖွင့်ထားသဖြင့် Browser က Camera/Mic ကို ပိတ်ထားပါသည်။ (HTTPS သို့မဟုတ် localhost ဖြင့် စမ်းပါ)`;
  }
  const name = err?.name || "Error";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Browser တွင် Camera/Mic ခွင့်ပြုချက် (Allow) ပိတ်ထားပါသည်";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Camera သို့မဟုတ် Microphone ရှာမတွေ့ပါ";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera/Mic ကို တခြား App သုံးနေပါသည်";
  }
  return `${name}: ${err?.message || "Camera/Mic ဖွင့်မရပါ"}`;
};

const GlobalVideoCall = () => {
  const { url, token } = useContext(StoreContext);

  const [callStatus, setCallStatus] = useState("idle"); // idle | calling | incoming | connected
  const [incomingCall, setIncomingCall] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [callSeconds, setCallSeconds] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const ringIntervalRef = useRef(null);
  const callStatusRef = useRef(callStatus);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // ဖုန်းဝင်သံ (Ringtone) ဖန်တီးပေးသည့် Function
  const playRingTone = (isIncoming = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(isIncoming ? 520 : 440, ctx.currentTime);
      if (isIncoming) {
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    if (callStatus === "incoming" || callStatus === "calling") {
      playRingTone(callStatus === "incoming");
      ringIntervalRef.current = setInterval(() => {
        playRingTone(callStatus === "incoming");
      }, 2200);
    } else {
      clearInterval(ringIntervalRef.current);
    }
    return () => clearInterval(ringIntervalRef.current);
  }, [callStatus]);

  useEffect(() => {
    let timer;
    if (callStatus === "connected") {
      setCallSeconds(0);
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatDuration = (sec) => {
    const mins = String(Math.floor(sec / 60)).padStart(2, "0");
    const secs = String(sec % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };
  // Chat Box ထဲသို့ VC Call မှတ်တမ်း ပို့ပေးမည့် Function
  const logCallToChat = async (targetUserId, statusText) => {
    if (!targetUserId || !token || !url) return;
    try {
      const formData = new FormData();
      formData.append("receiverId", targetUserId);
      formData.append("text", statusText);
      await axios.post(`${url}/api/chat/send`, formData, {
        headers: { token },
      });
    } catch (e) {}
  };

  const sendSignal = useCallback(
    async (toUserId, type, data) => {
      if (!token || !url || !toUserId) return;
      try {
        await axios.post(
          `${url}/api/chat/call/signal`,
          { toUserId, type, data },
          { headers: { token } }
        );
      } catch (e) {}
    },
    [token, url]
  );

  const cleanupCall = useCallback(() => {
    clearInterval(ringIntervalRef.current);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    pendingCandidatesRef.current = [];
    setCallStatus("idle");
    setIncomingCall(null);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCamOff(false);
    setCallSeconds(0);
  }, []);

  const createPeerConnection = useCallback(
    (targetUserId) => {
      let pc;
      try {
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      } catch (e) {
        pc = new RTCPeerConnection({ iceServers: [] });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal(targetUserId, "candidate", e.candidate);
        }
      };

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
          remoteVideoRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          toast.info("လိုင်းပြတ်တောက်သွားပါသည်");
          cleanupCall();
        }
      };

      peerRef.current = pc;
      return pc;
    },
    [cleanupCall, sendSignal]
  );

  const getSafeMediaStream = useCallback(async (mode = "user") => {
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error("HTTPS_REQUIRED");
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        throw err;
      }
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
    }
  }, []);

  const attachLocalStream = (stream) => {
    localStreamRef.current = stream;
    setIsCamOff(stream.getVideoTracks().length === 0);
    setIsMuted(stream.getAudioTracks().length === 0);
    setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
    }, 150);
  };

  const startOutgoingCall = useCallback(
    async (targetUser) => {
      if (!targetUser || callStatusRef.current !== "idle") return;
      try {
        const stream = await getSafeMediaStream(facingMode);
        attachLocalStream(stream);
        setRemoteUser(targetUser);
        setCallStatus("calling");

        const pc = createPeerConnection(targetUser._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(targetUser._id, "offer", offer);
      } catch (err) {
        toast.error(`Camera/Mic Error: ${formatMediaError(err)}`);
        cleanupCall();
      }
    },
    [cleanupCall, createPeerConnection, facingMode, getSafeMediaStream, sendSignal]
  );

  useEffect(() => {
    const handleStartCallEvent = (e) => {
      if (e.detail) startOutgoingCall(e.detail);
    };
    window.addEventListener("ibridge:start-vc", handleStartCallEvent);
    return () => window.removeEventListener("ibridge:start-vc", handleStartCallEvent);
  }, [startOutgoingCall]);

  const acceptVideoCall = async () => {
    if (!incomingCall) return;
    const callerInfo = {
      _id: incomingCall.fromUserId,
      name: incomingCall.fromName,
      avatar: incomingCall.fromAvatar,
    };
    const offerData = incomingCall.data;

    try {
      const stream = await getSafeMediaStream(facingMode);
      attachLocalStream(stream);
      setRemoteUser(callerInfo);
      setIncomingCall(null);
      setCallStatus("connected");

      const pc = createPeerConnection(callerInfo._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (offerData) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerData));
      }
      for (const cand of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(callerInfo._id, "answer", answer);
    } catch (err) {
      toast.error(`Camera/Mic Error: ${formatMediaError(err)}`);
      if (callerInfo._id) {
        sendSignal(callerInfo._id, "reject", {});
      }
      cleanupCall();
    }
  };

  // ငြင်းပယ်ခြင်း + Chat ထဲ မှတ်တမ်းချန်ခြင်း
  const rejectVideoCall = async () => {
    if (incomingCall) {
      await logCallToChat(incomingCall.fromUserId, "📵 Video Call ကို ငြင်းပယ်ခဲ့ပါသည်");
      sendSignal(incomingCall.fromUserId, "reject", {});
    }
    cleanupCall();
  };

  // ဖုန်းချခြင်း + Chat ထဲ ကြာချိန်မှတ်တမ်းချန်ခြင်း
  const endVideoCall = async () => {
    if (remoteUser) {
      const logMsg =
        callStatus === "connected"
          ? `📹 Video Call ပြီးဆုံးပါပြီ (ကြာချိန် - ${formatDuration(callSeconds)})`
          : "📵 Video Call ခေါ်ဆိုခဲ့ပါသည် (မကိုင်ပါ)";
      await logCallToChat(remoteUser._id, logMsg);
      sendSignal(remoteUser._id, "end", {});
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      if (!tracks.length) return;
      const nextEnabled = !tracks[0].enabled;
      tracks.forEach((t) => {
        t.enabled = nextEnabled;
      });
      setIsMuted(!nextEnabled);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getVideoTracks();
      if (!tracks.length) return;
      const nextEnabled = !tracks[0].enabled;
      tracks.forEach((t) => {
        t.enabled = nextEnabled;
      });
      setIsCamOff(!nextEnabled);
    }
  };

  const switchCamera = async () => {
    if (!localStreamRef.current) return;
    const nextMode = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = peerRef.current
        ?.getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
      }

      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());

      if (newVideoTrack) {
        localStreamRef.current.addTrack(newVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
      setFacingMode(nextMode);
      setIsCamOff(false);
    } catch (err) {
      toast.info("ကင်မရာ ပြောင်း၍မရပါ");
    }
  };
  useEffect(() => {
    if (!token || !url) return;

    let isMounted = true;

    const pollSignals = async () => {
      try {
        const res = await axios.get(`${url}/api/chat/call/poll`, {
          headers: { token },
        });
        if (
          !isMounted ||
          !res.data?.success ||
          !Array.isArray(res.data.signals) ||
          res.data.signals.length === 0
        ) {
          return;
        }

        for (const sig of res.data.signals) {
          if (!isMounted) break;

          if (sig.type === "offer") {
            if (callStatusRef.current !== "idle") {
              await sendSignal(sig.fromUserId, "busy", {});
            } else {
              pendingCandidatesRef.current = [];
              setIncomingCall(sig);
              setCallStatus("incoming");
            }
          } else if (sig.type === "answer" && peerRef.current) {
            await peerRef.current.setRemoteDescription(
              new RTCSessionDescription(sig.data)
            );
            for (const cand of pendingCandidatesRef.current) {
              await peerRef.current
                .addIceCandidate(new RTCIceCandidate(cand))
                .catch(() => {});
            }
            pendingCandidatesRef.current = [];
            setCallStatus("connected");
          } else if (sig.type === "candidate") {
            if (peerRef.current && peerRef.current.remoteDescription) {
              await peerRef.current
                .addIceCandidate(new RTCIceCandidate(sig.data))
                .catch(() => {});
            } else {
              pendingCandidatesRef.current.push(sig.data);
            }
          } else if (sig.type === "reject") {
            toast.warning("တစ်ဖက်မှ ဖုန်းခေါ်ဆိုမှုကို ငြင်းပယ်လိုက်ပါသည်");
            cleanupCall();
          } else if (sig.type === "busy") {
            toast.info("တစ်ဖက်လူ ဖုန်းမအားသေးပါ (Busy)");
            cleanupCall();
          } else if (sig.type === "end") {
            toast.info("Video Call ပြီးဆုံးသွားပါပြီ");
            cleanupCall();
          }
        }
      } catch (e) {}
    };

    pollSignals();
    const interval = setInterval(pollSignals, 800);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, url, sendSignal, cleanupCall]);

  if (callStatus === "idle") return null;

  return (
    <div
      className="gvc-overlay"
      onClick={() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.play().catch(() => {});
        }
        if (localVideoRef.current) {
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
      }}
    >
      {callStatus === "incoming" && incomingCall ? (
        <div className="gvc-incoming-card">
          <div className="gvc-ring-avatar">
            {incomingCall.fromAvatar ? (
              <img
                src={`${url}/images/${incomingCall.fromAvatar}`}
                alt={incomingCall.fromName}
              />
            ) : (
              <span>{incomingCall.fromName?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </div>
          <span className="gvc-badge">● INCOMING VIDEO CALL</span>
          <h2>{incomingCall.fromName}</h2>
          <p>IBRIDGE Encrypted Video Call ဝင်နေပါသည်...</p>

          <div className="gvc-incoming-actions">
            <button
              type="button"
              onClick={acceptVideoCall}
              className="gvc-btn-accept"
            >
              📞 လက်ခံမည် (Accept)
            </button>
            <button
              type="button"
              onClick={rejectVideoCall}
              className="gvc-btn-decline"
            >
              ✕ ငြင်းမည် (Decline)
            </button>
          </div>
        </div>
      ) : (
        <div className="gvc-active-stage">
          <div className="gvc-top-bar">
            <span className="gvc-caller-title">
              {callStatus === "calling"
                ? `📞 Calling ${remoteUser?.name || "User"}...`
                : `🟢 ${remoteUser?.name || "User"}`}
            </span>
            {callStatus === "connected" && (
              <span className="gvc-timer">{formatDuration(callSeconds)}</span>
            )}
          </div>

          <div className="gvc-videos-box">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="gvc-remote-vid"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="gvc-local-vid"
            />
          </div>

          <div className="gvc-controls">
            <button
              type="button"
              onClick={toggleMute}
              className={`gvc-ctrl-btn ${isMuted ? "active-off" : ""}`}
            >
              {isMuted ? "🔇 Unmute" : "🎤 Mute"}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className={`gvc-ctrl-btn ${isCamOff ? "active-off" : ""}`}
            >
              {isCamOff ? "🚫 Cam On" : "📷 Cam Off"}
            </button>
            <button
              type="button"
              onClick={switchCamera}
              className="gvc-ctrl-btn"
            >
              🔄 Flip
            </button>
            <button
              type="button"
              onClick={endVideoCall}
              className="gvc-btn-end"
            >
              📞 End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalVideoCall;