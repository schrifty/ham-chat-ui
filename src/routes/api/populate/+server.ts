import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { runPopulate } from "$lib/../../scripts/populate";
import { error } from "@sveltejs/kit";
import { logger } from "$lib/server/logger";
import { Database } from "$lib/server/database";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Test mode - just echo back the request
		if (body.test) {
			return json({ success: true, message: "Test successful", receivedBody: body });
		}

		const { flags } = body;

		if (!Array.isArray(flags)) {
			throw error(400, "Invalid flags format");
		}

		// Ensure database is initialized
		await Database.getInstance();

		logger.info({ flags }, "Starting database population");
		await runPopulate(flags);
		logger.info("Database population complete");

		return json({ success: true, message: "Database populated successfully" });
	} catch (e) {
		console.error("Error in populate endpoint:", e);
		logger.error({ error: e }, "Population error");
		throw error(500, `Failed to populate database: ${e.message}`);
	}
};
