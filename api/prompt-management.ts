import { config } from "dotenv";
import {
    CreatePromptRequest,
    UpdatePromptVersionRequestSchema,
    PromptSchema,
} from "./schemas/prompt.js";
import { PromptEndpoints } from "./endpoints/prompts.js";
config();

class PromptManager {
    private readonly headers: Record<string, string>;
    private readonly host: string = "https://cloud.langfuse.com";

    constructor({
        host,
        secretKey,
        publicKey,
    }: {
        host: string;
        secretKey: string;
        publicKey: string;
    }) {
        this.host = host;
        this.headers = {
            "Authorization": "Basic " + Buffer.from(`${publicKey}:${secretKey}`).toString("base64"),
            "Content-Type": "application/json",
        }
    }

    async listPrompts() {
        const response = await fetch(`${this.host}/api/public/v2/prompts`, {
            method: "GET",
            headers: this.headers,
        })

        if (!response.ok) {
            throw new Error(`Failed to list prompts: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    async createPrompt(prompt: CreatePromptRequest) {
        const response = await fetch(PromptEndpoints.create(this.host), {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(prompt),
        });

        if (!response.ok) {
            throw new Error(`Failed to create prompt: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    async getPrompt({
        name,
        version,
        label,
    }: {
        name: string;
        version?: number;
        label?: string;
    }) {
        const response = await fetch(PromptEndpoints.get(this.host, name, version, label), {
            method: "GET",
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to get prompt: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    }

    async updatePrompt({
        name,
        version,
        newLabels,
    }: {
        name: string;
        version: number;
        newLabels: string[];
    }) {
        // ─── Validate request payload -------------------------------------------------
        UpdatePromptVersionRequestSchema.parse({ newLabels });

        const response = await fetch(
            PromptEndpoints.update(this.host, name, version),
            {
                method: "PATCH",
                headers: this.headers,
                body: JSON.stringify({ newLabels }),
            },
        );

        if (!response.ok) {
            const errMsg = await response.text();
            throw new Error(
                `Failed to update prompt (HTTP ${response.status} – ${response.statusText}): ${errMsg}`,
            );
        }

        const json = await response.json();
        return PromptSchema.parse(json); // runtime validation of response
    }
}

export { PromptManager };