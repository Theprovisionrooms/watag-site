// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageThread from "../components/MessageThread.jsx";

export default function StaffThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [otherName, setOtherName] = useState("conversation");
  const [otherPhone, setOtherPhone] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    fetch(`/api/enquiries/threads?staffId=${id}`)
      .then((res) => res.json())
      .then((threads) => {
        const match = threads.find((t) => String(t.id) === threadId);
        if (match) {
          setOtherName(match.other_name);
          setOtherPhone(match.other_phone || null);
        }
      });
  }, [navigate, threadId]);

  if (!staffId) return null;

  return (
    <MessageThread
      threadId={threadId}
      identity={{ type: "staff", staffId }}
      otherName={otherName}
      subtitle={otherPhone}
      backTo="/staff/messages"
      accentColor="var(--watag-cyan)"
    />
  );
}
