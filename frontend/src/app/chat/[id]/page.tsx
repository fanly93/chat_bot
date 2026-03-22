"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import ChatArea from "@/components/chat/ChatArea";

export default function ConversationPage() {
  const params = useParams();
  const { setCurrentId } = useChatStore();
  const id = params.id as string;

  useEffect(() => {
    setCurrentId(id);
  }, [id, setCurrentId]);

  return <ChatArea />;
}
