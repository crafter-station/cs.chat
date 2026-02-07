"use client";

import {
  LogInIcon,
  MessageSquarePlusIcon,
  SearchIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useThreads, useDeleteThread } from "@/hooks/use-threads";
import { useChatContext } from "@/lib/chat-context";
import {
  prefetchMessages,
  clearCachedMessages,
} from "@/lib/message-cache";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: threads = [] } = useThreads();
  const deleteThread = useDeleteThread();
  const { activeChatId, setActiveChatId, startNewChat } = useChatContext();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <span className="text-base font-semibold tracking-tight text-center w-full flex items-center justify-center gap-1.5">
                  C3.chat
                  <span className="text-[9px] font-medium uppercase tracking-widest text-rose/70 bg-rose/10 rounded-full px-1.5 py-px">
                    beta
                  </span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* New Chat button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={startNewChat}
              className="group/new bg-rose text-rose-foreground hover:bg-rose/90 hover:text-rose-foreground active:bg-rose/90 active:text-rose-foreground min-w-8 duration-200 ease-linear"
            >
              <MessageSquarePlusIcon className="size-4" />
              <span>New Chat</span>
              <kbd className="ml-auto hidden text-[10px] font-normal opacity-0 transition-opacity duration-200 group-hover/new:opacity-60 sm:inline-flex items-center gap-0.5 text-rose-foreground/80">
                <span className="text-xs">&#8984;</span>&#8679;O
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Search */}
        <form>
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <SidebarInput
                id="search"
                placeholder="Search your threads..."
                className="pl-8"
              />
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none text-muted-foreground" />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      </SidebarHeader>

      <SidebarContent>
        {/* Chat threads */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  <SidebarMenuButton
                    isActive={thread.id === activeChatId}
                    onClick={() => setActiveChatId(thread.id)}
                    onMouseEnter={() => prefetchMessages(thread.id)}
                    className="truncate"
                  >
                    {thread.title === null ? (
                      <Shimmer as="span" duration={1.5}>
                        New chat
                      </Shimmer>
                    ) : (
                      <span className="truncate">{thread.title}</span>
                    )}
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCachedMessages(thread.id);
                      deleteThread.mutate(thread.id);
                      if (activeChatId === thread.id) {
                        startNewChat();
                      }
                    }}
                  >
                    <Trash2Icon className="size-3.5" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom nav items */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <SettingsIcon />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignedOut>
              <SignInButton mode="modal">
                <SidebarMenuButton>
                  <LogInIcon />
                  <span>Login</span>
                </SidebarMenuButton>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <SidebarMenuButton asChild>
                <div className="flex items-center gap-2">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: { avatarBox: "size-5" },
                    }}
                  />
                  <span>Account</span>
                </div>
              </SidebarMenuButton>
            </SignedIn>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
