import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { promises as fs } from "fs";
import YAML from "yaml";

export async function GET({ setHeaders }: RequestEvent) {
	try {
		const filePath = "c:\\Users\\schri\\Projects\\ham-chat-ui\\lke\\prompt.yml";
		console.log("Reading prompts from:", filePath);
		const fileContent = await fs.readFile(filePath, { encoding: "utf-8" });
		console.log("File content:", fileContent);
		const prompts = YAML.parse(fileContent);
		setHeaders({
			"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		});
		return json(prompts);
	} catch (error) {
		console.error("Error reading prompts:", error);
		return json([], { status: 500 });
	}
}
