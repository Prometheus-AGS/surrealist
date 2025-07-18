import sidekickImg from "~/assets/images/icons/sidekick.webp";
import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Image,
	Menu,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
} from "@mantine/core";

import {
	iconAccount,
	iconChevronRight,
	iconCreditCard,
	iconCursor,
	iconDotsVertical,
	iconDownload,
	iconHistory,
	iconLive,
	iconOpen,
	iconPlus,
	iconQuery,
	iconRelation,
	iconReset,
	iconStar,
	iconTable,
	iconTransfer,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import { shuffle } from "radash";
import { memo, useEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useCloudProfile, useIsAuthenticated } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { newId } from "~/util/helpers";
import { useCopilotMutation } from "./copilot";
import { ChatMessage } from "./message";

const QUESTIONS = [
	{ icon: iconCreditCard, title: "How do I manage Cloud billing?" },
	{ icon: iconPlus, title: "How do I create records?" },
	{ icon: iconAccount, title: "How can I authenticate users?" },
	{ icon: iconTransfer, title: "How do I execute transactions?" },
	{ icon: iconTable, title: "How do I design a schema?" },
	{ icon: iconQuery, title: "How do I optimise my database?" },
	{ icon: iconHistory, title: "How do I view my query history?" },
	{ icon: iconStar, title: "How do I save queries?" },
	{ icon: iconDownload, title: "How do I export my database?" },
	{ icon: iconReset, title: "How do I recurse graphs?" },
	{ icon: iconRelation, title: "How do I visualize graphs?" },
	{ icon: iconLive, title: "How do I listen to changes?" },
];

const ChatMessageLazy = memo(ChatMessage);

export function Sidekick() {
	const { pushChatMessage, clearChatSession } = useCloudStore.getState();

	const isLight = useIsLight();
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useInputState("");

	const profile = useCloudProfile();
	const isAuthed = useIsAuthenticated();
	const conversation = useCloudStore((s) => s.chatConversation);
	const lastResponse = useCloudStore((s) => s.chatLastResponse);

	const { sendMessage, isResponding } = useCopilotMutation();

	const hasMessage = useMemo(() => input.trim() !== "", [input]);
	const canSend = input && !isResponding && hasMessage;

	const submitMessage = useStable(() => {
		if (!canSend) return;

		pushChatMessage({
			id: newId(),
			content: input,
			sender: "user",
			thinking: "",
			loading: false,
		});

		inputRef.current?.focus();
		sendMessage(input);
		setInput("");
	});

	const handleKeyDown = useStable((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submitMessage();
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;

			if (scrollHeight - clientHeight - scrollTop < 150) {
				scrollRef.current?.scrollTo({
					top: scrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [conversation]);

	const questions = useMemo(() => shuffle(QUESTIONS).slice(0, 4), []);

	return (
		<Stack
			gap={0}
			h="100%"
			w="100%"
			align="center"
		>
			<Box
				flex={1}
				w="100%"
				pos="relative"
			>
				{conversation.length > 0 && isAuthed ? (
					<ScrollArea
						pos="absolute"
						viewportRef={scrollRef}
						inset={0}
					>
						<Box
							mx="auto"
							maw={900}
							pb={68}
						>
							<Stack
								mt={42}
								gap={42}
							>
								{conversation.map((message, i) => (
									<ChatMessageLazy
										message={message}
										profile={profile}
										lastResponse={lastResponse}
										isResponding={isResponding}
										isLight={isLight}
										key={i}
									/>
								))}
							</Stack>
						</Box>
					</ScrollArea>
				) : (
					<Center h="90%">
						<Stack align="center">
							<Image
								src={sidekickImg}
								alt="Sidekick"
								w={196}
							/>
							<PrimaryTitle fz={42}>Welcome to Sidekick</PrimaryTitle>
							<Text fz="xl">
								Your personal Surreal assistant designed to answer your database
								questions.
							</Text>
							{isAuthed ? (
								<SimpleGrid
									mt="xl"
									cols={{
										xs: 1,
										sm: 2,
									}}
								>
									{questions.map((question) => (
										<Paper
											key={question.title}
											role="button"
											radius={100}
											tabIndex={0}
											variant="interactive"
											onClick={() => {
												setInput(question.title);
												inputRef.current?.focus();
											}}
											p="sm"
										>
											<Group
												align="center"
												wrap="nowrap"
											>
												<ThemeIcon
													radius={100}
													color="violet"
													variant="light"
													size="xl"
												>
													<Icon
														path={question.icon}
														size="lg"
													/>
												</ThemeIcon>
												<PrimaryTitle
													c="bright"
													fw={500}
													fz="xl"
													pr="md"
												>
													{question.title}
												</PrimaryTitle>
											</Group>
										</Paper>
									))}
								</SimpleGrid>
							) : (
								<Group
									mt="xl"
									w="100%"
									maw={450}
								>
									<Button
										flex={1}
										variant="gradient"
										onClick={openCloudAuthentication}
										rightSection={<Icon path={iconChevronRight} />}
									>
										Sign in
									</Button>
									<Button
										flex={1}
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl("https://surrealdb.com/sidekick")
										}
									>
										Learn more
									</Button>
								</Group>
							)}
						</Stack>
					</Center>
				)}
			</Box>

			{isAuthed && (
				<Box
					maw={900}
					w="100%"
					style={{
						transform: "translateY(-24px)",
					}}
				>
					<Textarea
						ref={inputRef}
						size="lg"
						rows={1}
						maxRows={12}
						autosize
						className={classes.input}
						placeholder="Send a message..."
						onKeyDown={handleKeyDown}
						value={input}
						autoFocus
						onChange={setInput}
						rightSectionWidth={96}
						rightSection={
							<Group wrap="nowrap">
								<Menu position="top">
									<Menu.Target>
										<ActionIcon
											size="lg"
											color="slate"
											variant="subtle"
											onClick={submitMessage}
										>
											<Icon path={iconDotsVertical} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item
											leftSection={<Icon path={iconReset} />}
											onClick={clearChatSession}
										>
											Reset conversation
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
								<ActionIcon
									size="lg"
									type="submit"
									variant="gradient"
									disabled={!canSend}
									onClick={submitMessage}
									loading={isResponding}
									style={{
										opacity: canSend ? 1 : 0.5,
										border: "1px solid rgba(255, 255, 255, 0.3)",
										backgroundOrigin: "border-box",
										filter: canSend ? undefined : "saturate(0%)",
										transition: "all 0.1s",
									}}
								>
									<Icon
										path={iconCursor}
										c="white"
									/>
								</ActionIcon>
							</Group>
						}
					/>
					<Text
						mt="sm"
						ta="center"
						c="slate"
					>
						You are chatting with an AI assistant, responses may be inaccurate. Refrain
						from submitting sensitive data.
					</Text>
				</Box>
			)}
		</Stack>
	);
}
