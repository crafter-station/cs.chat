"use client";

import { memo, useCallback, useEffect, useState, type RefObject } from "react";
import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { models, chefs, type Model } from "@/lib/models";
import { UsageBanner } from "@/components/usage-banner";
import { LocalModelBanner } from "@/components/local-model-banner";
import { isWebGpuAvailable } from "@/lib/local-model/client";

interface ModelItemProps {
  model: Model;
  selectedModel: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const ModelItem = memo(
  ({ model, selectedModel, onSelect, disabled }: ModelItemProps) => {
    const handleSelect = useCallback(() => {
      if (disabled) return;
      onSelect(model.id);
    }, [onSelect, model.id, disabled]);
    return (
      <ModelSelectorItem
        onSelect={handleSelect}
        value={model.id}
        disabled={disabled}
      >
        <ModelSelectorLogo provider={model.chefSlug} />
        <ModelSelectorName>{model.name}</ModelSelectorName>
        {model.isLocal ? (
          <span className="ml-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            {disabled ? "no webgpu" : "local · ∞"}
          </span>
        ) : (
          <ModelSelectorLogoGroup>
            {model.providers.map((provider) => (
              <ModelSelectorLogo key={provider} provider={provider} />
            ))}
          </ModelSelectorLogoGroup>
        )}
        {selectedModel === model.id ? (
          <CheckIcon className="ml-auto size-4" />
        ) : (
          <div className="ml-auto size-4" />
        )}
      </ModelSelectorItem>
    );
  },
);

ModelItem.displayName = "ModelItem";

interface ChatInputProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  selectedModel: string;
  canSend: boolean;
  isGenerating: boolean;
  isNewChat: boolean;
  isTyping: boolean;
  status: ChatStatus;
  text: string;
  onTextChange: (text: string) => void;
  onSubmit: (text: string) => void;
  onModelSelect: (id: string) => void;
}

export function ChatInput({
  textareaRef,
  selectedModel,
  canSend,
  isGenerating,
  isNewChat,
  isTyping,
  status,
  text,
  onTextChange,
  onSubmit,
  onModelSelect,
}: ChatInputProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [webGpuOk, setWebGpuOk] = useState(true);
  const selectedModelData = models.find((m) => m.id === selectedModel);

  // WebGPU is only present in Chrome/Edge today. Disable local models otherwise.
  useEffect(() => {
    setWebGpuOk(isWebGpuAvailable());
  }, []);

  const handleModelSelect = useCallback(
    (id: string) => {
      onModelSelect(id);
      setModelSelectorOpen(false);
    },
    [onModelSelect]
  );

  const handleModelSelectorOpenChange = useCallback(
    (open: boolean) => {
      setModelSelectorOpen(open);
    },
    []
  );

  // Prevent Radix from refocusing the trigger; redirect to textarea
  const handleCloseAutoFocus = useCallback(
    (e: Event) => {
      e.preventDefault();
      textareaRef.current?.focus();
    },
    [textareaRef]
  );

  // Cmd+M → open model selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModelSelectorOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text) {
      onSubmit(message.text);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-x-visible px-2">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col overflow-x-visible text-center">
        {isNewChat && (
          <p
            className={`pointer-events-auto mb-2 text-center text-xs text-muted-foreground transition-opacity duration-200 ease-out ${
              isTyping ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            Make sure you agree to our{" "}
            <a href="/terms" className="font-medium text-foreground underline">
              Terms
            </a>{" "}
            and our{" "}
            <a href="/privacy" className="font-medium text-foreground underline">
              Privacy Policy
            </a>
          </p>
        )}

        <LocalModelBanner />
        <UsageBanner />

        <div className="pointer-events-auto">
          <div className="border-reflect pointer-events-none min-w-0 overflow-hidden rounded-t-[20px] bg-[var(--chat-input-background)] p-2 pb-0 backdrop-blur-lg">
            <PromptInput
              onSubmit={handleSubmit}
              className="pointer-events-auto w-full [&_[data-slot=input-group]]:rounded-t-xl [&_[data-slot=input-group]]:rounded-b-none [&_[data-slot=input-group]]:border [&_[data-slot=input-group]]:border-b-0 [&_[data-slot=input-group]]:border-black/30 [&_[data-slot=input-group]]:bg-[var(--chat-input-background)] [&_[data-slot=input-group]]:shadow-[0_80px_50px_rgba(0,0,0,0.08),0_50px_30px_rgba(0,0,0,0.06),0_30px_15px_rgba(0,0,0,0.05),0_15px_8px_rgba(0,0,0,0.04),0_6px_4px_rgba(0,0,0,0.03),0_2px_2px_rgba(0,0,0,0.02)] [&_[data-slot=input-group]]:outline-8 [&_[data-slot=input-group]]:outline-offset-0 [&_[data-slot=input-group]]:outline-[var(--chat-input-gradient)]/50 dark:[&_[data-slot=input-group]]:border-white/35 dark:[&_[data-slot=input-group]]:bg-[oklch(0.18_0_0_/_60%)] dark:[&_[data-slot=input-group]]:outline-[var(--chat-input-gradient)]/40"
            >
              <PromptInputBody>
                <PromptInputTextarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  disabled={!canSend || isGenerating}
                  placeholder={!canSend ? "Daily limit reached — sign up to continue" : isGenerating ? "Waiting for response..." : "Type your message here..."}
                  className="min-h-12 text-base leading-6"
                />
              </PromptInputBody>
              <PromptInputFooter className="@container">
                <PromptInputTools>
                  <ModelSelector
                    onOpenChange={handleModelSelectorOpenChange}
                    open={modelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group/model min-w-0 max-w-[140px] gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground @md:max-w-none"
                      >
                        <div className="min-w-0 flex-1 text-left text-sm font-medium">
                          <div className="truncate">
                            {selectedModelData?.name ?? "Select model"}
                          </div>
                        </div>
                        <kbd className="hidden text-[10px] font-normal text-muted-foreground/50 opacity-0 transition-opacity group-hover/model:opacity-100 @md:inline-flex">
                          &#8984;K
                        </kbd>
                        <ChevronDownIcon className="size-4 text-muted-foreground/60 transition-transform duration-200" />
                      </Button>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent title="Select a model" onCloseAutoFocus={handleCloseAutoFocus}>
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>
                          No models found.
                        </ModelSelectorEmpty>
                        {chefs.map((chef) => (
                          <ModelSelectorGroup heading={chef} key={chef}>
                            {models
                              .filter((m) => m.chef === chef)
                              .map((model) => (
                                <ModelItem
                                  key={model.id}
                                  model={model}
                                  onSelect={handleModelSelect}
                                  selectedModel={selectedModel}
                                  disabled={model.isLocal && !webGpuOk}
                                />
                              ))}
                          </ModelSelectorGroup>
                        ))}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>

                  {/* TODO: Search the web — not yet available */}
                  {/* TODO: Attach files — not yet available */}
                </PromptInputTools>

                <PromptInputSubmit
                  disabled={!text.trim() || !canSend}
                  status={status}
                  className="border-reflect button-reflect size-9 rounded-lg bg-rose font-semibold text-rose-foreground shadow-sm hover:bg-rose/80 active:bg-rose disabled:hover:bg-rose dark:bg-primary/20 dark:text-pink-50 dark:hover:bg-pink-800/70 dark:active:bg-pink-800/40 dark:disabled:hover:bg-primary/20"
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
