"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useChatStore } from "@/stores/chatStore";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";

export default function ConversationPage() {
  const params = useParams();
  const { setCurrentId } = useChatStore();
  const id = params.id as string;

  useEffect(() => {
    setCurrentId(id);
  }, [id, setCurrentId]);

  return (
    <>
      <MessageList />
      <ChatInput />
    </>
  );
}
