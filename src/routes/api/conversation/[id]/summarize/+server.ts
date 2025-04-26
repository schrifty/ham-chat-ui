import { authCondition } from "$lib/server/auth";
import { collections } from "$lib/server/database";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import type { Message } from "$lib/types/Message";
import { ObjectId } from "mongodb";
import { json } from "@sveltejs/kit";
import { logger } from "$lib/server/logger.js";
import { defaultModel, models } from "$lib/server/models";
import { getReturnFromGenerator } from "$lib/utils/getReturnFromGenerator";
import { generate } from "$lib/server/textGeneration/generate";
import type { EndpointMessage } from "$lib/server/endpoints/endpoints";
import type { MessageUpdate } from "$lib/types/MessageUpdate";
import { MessageUpdateType } from "$lib/types/MessageUpdate";

// Helper function to convert AsyncIterable to AsyncGenerator
async function* wrapAsGenerator<T>(iterable: AsyncIterable<T>): AsyncGenerator<T, T | undefined> {
	let lastValue: T | undefined;
	for await (const value of iterable) {
		lastValue = value;
		yield value;
	}
	return lastValue;
}

export async function POST({ locals, params }) {
	// Validate conversation ID
	const id = z.string().parse(params.id);

	// Get conversation messages
	const conversation = await collections.conversations.findOne({
		_id: new ObjectId(id),
		...authCondition(locals),
	});

	if (!conversation) {
		throw error(404, "Conversation not found");
	}

	// Get all messages in the conversation
	const messages = conversation.messages as Message[];

	// Create a summary prompt
	const summaryPrompt = `Write a concise summary of this conversation. There should be no added prefixes or suffixes - just the summary. Be direct and focus on the key topics or actions. Do not include meta-commentary.

Conversation:
${messages.map((msg) => `${msg.from}: ${msg.content}`).join("\n")}

Remember: The summary itself (excluding "Summary: ") must be 100 characters or less.`;

	// Get the model to use - either from conversation or default
	const modelId = conversation.model ?? defaultModel.id;
	const model = models.find((m) => m.id === modelId) ?? defaultModel;

	try {
		// Get the model's endpoint
		const endpoint = await model.getEndpoint();

		// Convert to endpoint message format
		const endpointMessages: EndpointMessage[] = [
			{
				from: "user",
				content: summaryPrompt,
			},
		];

		// Generate summary using the selected model
		const result = await getReturnFromGenerator(
			wrapAsGenerator<MessageUpdate>(
				generate(
					{
						model,
						endpoint,
						conv: conversation,
						messages: endpointMessages,
						isContinue: false,
						webSearch: false,
						toolsPreference: [],
						promptedAt: new Date(),
						ip: "",
					},
					[],
					undefined,
					undefined
				)
			)
		);

		// Extract the summary text from the result
		let summary = "";
		if (result?.type === MessageUpdateType.FinalAnswer) {
			summary = result.text;
			if (!summary.startsWith("Summary: ")) {
				summary = `Summary: ${summary}`;
			}
		} else if (result?.type === MessageUpdateType.Stream) {
			summary = `Summary: ${result.token}`;
		}

		// Save the summary to the database
		await collections.conversations.updateOne(
			{
				_id: new ObjectId(id),
				...authCondition(locals),
			},
			{
				$set: {
					summary,
				},
			}
		);

		// Log the summarization
		logger.info("Generated conversation summary", {
			conversationId: id,
			summary,
			summaryLength: summary.length,
			model: model.id,
		});

		return json({ summary });
	} catch (e) {
		logger.error("Failed to generate summary", {
			conversationId: id,
			model: model.id,
			error: e,
		});
		throw error(500, "Failed to generate summary");
	}
}
