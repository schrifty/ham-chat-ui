import { authCondition } from "$lib/server/auth";
import { collections } from "$lib/server/database";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import type { Message } from "$lib/types/Message";
import { ObjectId } from "mongodb";
import { json } from "@sveltejs/kit";
import { logger } from "$lib/server/logger.js";

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
	const summaryPrompt = `Please provide a concise summary (60 characters or less) of the following conversation:\n\n${messages
		.map((msg) => `${msg.from}: ${msg.content}`)
		.join("\n")}`;

	// Generate summary using OpenAI API directly
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "gpt-4",
			messages: [{ role: "user", content: summaryPrompt }],
			max_tokens: 30,
			temperature: 0.7,
		}),
	});

	if (!response.ok) {
		throw error(500, "Failed to generate summary");
	}

	const result = await response.json();
	const summary = result.choices[0].message.content;

	// Trim and ensure summary is not too long
	const trimmedSummary = summary.trim().slice(0, 60);

	// Save the summary to the database
	await collections.conversations.updateOne(
		{ _id: new ObjectId(id) },
		{ $set: { summary: trimmedSummary } }
	);

	// Log the summarization
	logger.info("Generated conversation summary", {
		conversationId: id,
		summaryLength: trimmedSummary.length,
	});

	return json({ summary: trimmedSummary });
}
