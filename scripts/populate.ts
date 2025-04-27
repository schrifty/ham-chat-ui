import { faker } from "@faker-js/faker";
import { ObjectId } from "mongodb";
import { collections } from "$lib/server/database";
import { models } from "$lib/server/models";
import { defaultEmbeddingModel } from "$lib/server/embeddingModels";
import { generateSearchTokens } from "$lib/utils/searchTokens";
import { ReviewStatus } from "$lib/types/Review";
import type { User } from "$lib/types/User";
import type { Assistant } from "$lib/types/Assistant";
import type { Conversation } from "$lib/types/Conversation";
import type { Settings } from "$lib/types/Settings";
import type { Message } from "$lib/types/Message";
import type { CommunityToolDB, ToolLogoColor, ToolLogoIcon } from "$lib/types/Tool";
import { logger } from "$lib/server/logger";

// Sample conversation messages for testing
const samples = [
	"Hello! How can I help you today?",
	"I'm looking for information about machine learning.",
	"I'd be happy to help you learn about machine learning! What specific aspects would you like to know about?",
	"Can you explain neural networks in simple terms?",
	"A neural network is like a digital brain that learns from examples. Just as our brains learn from experience, neural networks learn from data. They're made up of layers of connected 'neurons' that process information and make decisions.",
];

async function generateMessages(_preprompt?: string): Promise<Message[]> {
	const messages: Message[] = [];
	let isAssistant = true;

	for (const content of samples) {
		const message: Message = {
			_id: new ObjectId(),
			createdAt: faker.date.recent({ days: 30 }),
			updatedAt: faker.date.recent({ days: 30 }),
			content,
			role: isAssistant ? "assistant" : "user",
			modelId: isAssistant
				? faker.helpers.arrayElement(models.map((model) => model.id))
				: undefined,
			toolCalls: [],
			updates: [],
			reasoning: isAssistant ? faker.lorem.sentence() : undefined,
			reasoningUpdates: [],
		};
		messages.push(message);
		isAssistant = !isAssistant;
	}

	return messages;
}

export async function runPopulate(flags: string[]) {
	logger.info("\n=== Starting Database Population ===");
	logger.info({ flags }, "Population flags");

	const modelIds = models.map((model) => model.id);
	logger.info({ modelIds }, "Available models");

	if (flags.includes("reset")) {
		logger.info("\n--- Resetting Collections ---");
		try {
			await collections.users.deleteMany({});
			await collections.settings.deleteMany({});
			await collections.assistants.deleteMany({});
			await collections.conversations.deleteMany({});
			await collections.tools.deleteMany({});
			await collections.migrationResults.deleteMany({});
			await collections.semaphores.deleteMany({});
			logger.info("✓ All collections reset successfully");
		} catch (error) {
			logger.error({ error }, "❌ Error resetting collections");
			throw error;
		}
	}

	if (flags.includes("users") || flags.includes("all")) {
		logger.info("\n--- Creating Users ---");
		try {
			const newUsers: User[] = Array.from({ length: 100 }, () => ({
				_id: new ObjectId(),
				createdAt: faker.date.recent({ days: 30 }),
				updatedAt: faker.date.recent({ days: 30 }),
				username: faker.internet.userName(),
				name: faker.person.fullName(),
				hfUserId: faker.string.alphanumeric(24),
				avatarUrl: faker.image.avatar(),
			}));
			await collections.users.insertMany(newUsers);
			logger.info({ count: newUsers.length }, "✓ Created users");
			logger.info({ sampleUser: newUsers[0] }, "Sample user");
		} catch (error) {
			logger.error({ error }, "❌ Error creating users");
			throw error;
		}
	}

	const users = await collections.users.find().toArray();
	logger.info({ count: users.length }, "Found users in database");

	if (flags.includes("settings") || flags.includes("all")) {
		logger.info("\n--- Creating Settings ---");
		try {
			await Promise.all(
				users.map(async (user) => {
					const settings: Settings = {
						userId: user._id,
						shareConversationsWithModelAuthors: faker.datatype.boolean(0.25),
						hideEmojiOnSidebar: faker.datatype.boolean(0.25),
						ethicsModalAcceptedAt: faker.date.recent({ days: 30 }),
						activeModel: faker.helpers.arrayElement(modelIds),
						createdAt: faker.date.recent({ days: 30 }),
						updatedAt: faker.date.recent({ days: 30 }),
						disableStream: faker.datatype.boolean(0.25),
						directPaste: faker.datatype.boolean(0.25),
						customPrompts: {},
						assistants: [],
					};
					await collections.settings.updateOne(
						{ userId: user._id },
						{ $set: settings },
						{ upsert: true }
					);
					logger.info({ userId: user._id }, "✓ Created settings for user");
				})
			);
		} catch (error) {
			logger.error({ error }, "❌ Error creating settings");
			throw error;
		}
	}

	if (flags.includes("assistants") || flags.includes("all")) {
		logger.info("\n--- Creating Assistants ---");
		try {
			await Promise.all(
				users.map(async (user) => {
					const name = faker.animal.insect();
					const assistants = faker.helpers.multiple<Assistant>(
						() => ({
							_id: new ObjectId(),
							name,
							createdById: user._id,
							createdByName: user.username,
							createdAt: faker.date.recent({ days: 30 }),
							updatedAt: faker.date.recent({ days: 30 }),
							userCount: faker.number.int({ min: 1, max: 100000 }),
							review: faker.helpers.enumValue(ReviewStatus),
							modelId: faker.helpers.arrayElement(modelIds),
							description: faker.lorem.sentence(),
							preprompt: faker.hacker.phrase(),
							exampleInputs: faker.helpers.multiple(() => faker.lorem.sentence(), {
								count: faker.number.int({ min: 0, max: 4 }),
							}),
							searchTokens: generateSearchTokens(name),
							last24HoursCount: faker.number.int({ min: 0, max: 1000 }),
						}),
						{ count: faker.number.int({ min: 3, max: 10 }) }
					);

					await collections.assistants.insertMany(assistants);
					await collections.settings.updateOne(
						{ userId: user._id },
						{ $set: { assistants: assistants.map((a) => a._id.toString()) } },
						{ upsert: true }
					);
					logger.info(
						{ count: assistants.length },
						`✓ Created assistants for user ${user.username}`
					);
				})
			);
		} catch (error) {
			logger.error({ error }, "❌ Error creating assistants");
			throw error;
		}
	}

	if (flags.includes("conversations") || flags.includes("all")) {
		logger.info("\n--- Creating Conversations ---");
		try {
			await Promise.all(
				users.map(async (user) => {
					const conversations = faker.helpers.multiple(
						async () => {
							const settings = await collections.settings.findOne({ userId: user._id });
							const assistantId =
								settings?.assistants && settings.assistants.length > 0
									? faker.helpers.arrayElement(settings.assistants)
									: undefined;
							const preprompt = assistantId
								? await collections.assistants
										.findOne({ _id: assistantId })
										.then((a: Assistant) => a?.preprompt ?? "")
								: (faker.helpers.maybe(() => faker.hacker.phrase(), { probability: 0.5 }) ?? "");

							const messages = await generateMessages(preprompt);

							return {
								_id: new ObjectId(),
								userId: user._id,
								assistantId,
								preprompt,
								createdAt: faker.date.recent({ days: 145 }),
								updatedAt: faker.date.recent({ days: 145 }),
								model: faker.helpers.arrayElement(modelIds),
								title: faker.internet.emoji() + " " + faker.hacker.phrase(),
								embeddingModel: defaultEmbeddingModel.id,
								messages,
								rootMessageId: messages[0].id,
							} satisfies Conversation;
						},
						{ count: faker.number.int({ min: 10, max: 200 }) }
					);

					await collections.conversations.insertMany(await Promise.all(conversations));
					logger.info(
						{ count: conversations.length },
						`✓ Created conversations for user ${user.username}`
					);
				})
			);
		} catch (error) {
			logger.error({ error }, "❌ Error creating conversations");
			throw error;
		}
	}

	if (flags.includes("tools") || flags.includes("all")) {
		logger.info("\n--- Creating Tools ---");
		try {
			const tools = await Promise.all(
				faker.helpers.multiple(
					() => {
						const _id = new ObjectId();
						const displayName = faker.company.catchPhrase();
						const description = faker.company.catchPhrase();
						const color = faker.helpers.arrayElement([
							"purple",
							"blue",
							"green",
							"yellow",
							"red",
						]) as ToolLogoColor;
						const icon = faker.helpers.arrayElement([
							"wikis",
							"tools",
							"camera",
							"code",
							"email",
							"cloud",
							"terminal",
							"game",
							"chat",
							"speaker",
							"video",
						]) as ToolLogoIcon;

						const user = faker.helpers.arrayElement(users);
						const createdById = user._id;
						const createdByName = user.username ?? user.name;

						return {
							type: "community",
							_id,
							createdById,
							createdByName,
							displayName,
							name: displayName.toLowerCase().replace(" ", "_"),
							endpoint: "/test",
							description,
							color,
							icon,
							baseUrl: faker.helpers.arrayElement([
								"stabilityai/stable-diffusion-3-medium",
								"multimodalart/cosxl",
							]),
							inputs: [],
							outputPath: null,
							outputType: "str",
							showOutput: false,
							useCount: faker.number.int({ min: 0, max: 100000 }),
							last24HoursUseCount: faker.number.int({ min: 0, max: 1000 }),
							createdAt: faker.date.recent({ days: 30 }),
							updatedAt: faker.date.recent({ days: 30 }),
							searchTokens: generateSearchTokens(displayName),
							review: faker.helpers.enumValue(ReviewStatus),
							outputComponent: null,
							outputComponentIdx: null,
						};
					},
					{ count: faker.number.int({ min: 10, max: 200 }) }
				)
			);

			await collections.tools.insertMany(tools satisfies CommunityToolDB[]);
			logger.info({ count: tools.length }, "✓ Created tools");
		} catch (error) {
			logger.error({ error }, "❌ Error creating tools");
			throw error;
		}
	}

	logger.info("\n=== Database Population Complete ===");
}
