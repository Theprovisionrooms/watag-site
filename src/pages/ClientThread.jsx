// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageThread from "../components/MessageThread.jsx";

export default function ClientThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [otherName, setOtherName] = useState("messages");

  useEffect(() => {
    const t = localStorage.getItem("watag_session_token");
    if (!t) {
      navigate("/card");
      return;
    }
    setToken(t);
    fetch("/api/enquiries/threads", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => res.json())
      .then((threads) => {
        const match = threads.find((th) => String(th.id) === threadId);
        if (match) setOtherName(match.other_name);
      });
  }, [navigate, threadId]);

  if (!token) return null;

  return (
    <MessageThread
      threadId={threadId}
      identity={{ type: "client", token }}
      otherName={otherName}
      backTo="/messages"
    />
  );
}
