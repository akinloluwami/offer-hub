"use client"

import { useState } from "react"
import { Header } from "@/components/account-settings/header"
import { Sidebar } from "@/components/account-settings/sidebar"
import { MessagesSidebar } from "@/components/messages/messages-sidebar"
import { MessagesMainPlus } from "@/components/messaging/messages-main-plus"

import { useMessagesMock as useMessages } from "@/hooks/useMessagesMock"

export default function MessagingPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeConversation,
    messages,
    handleSendMessage,
  } = useMessages()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserActive, setIsUserActive] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isUserActive={isUserActive}
          setIsUserActive={setIsUserActive}
        />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-140px)] flex overflow-hidden">
            <MessagesSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onConversationSelect={setActiveConversationId}
            />
            <MessagesMainPlus
              activeConversation={activeConversation as any}
              messages={messages as any}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
