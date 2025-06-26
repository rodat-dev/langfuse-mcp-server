import { createMcpHandler } from "@vercel/mcp-adapter";
import { PromptManager } from "./prompt-management.js";
import { CreatePromptRequest, CreatePromptRequestSchema } from "./schemas/prompt.js";
import { z } from "zod";
import { type GetPromptResult } from "@modelcontextprotocol/sdk/types.js";

async function handleRequest(request: Request) {
  const url: URL = new URL(request.url);
  const queryParams = url.searchParams;
  const host = queryParams.get("host") || process.env.LANGFUSE_HOST || "https://cloud.langfuse.com";
  const secretKey = queryParams.get("secretKey") || process.env.LANGFUSE_SECRET_KEY || "";
  const publicKey = queryParams.get("publicKey") || process.env.LANGFUSE_PUBLIC_KEY || "";

  const promptManager = new PromptManager(
    {
      host,
      secretKey,
      publicKey,
    }
  );

  const astrodogPrompts = [
    "denis",
    "frankie",
    "jess",
    "peggy",
    "mish",
    "otto",
    "gertie"
  ];

  const astrodogMissionReportPrompts = astrodogPrompts.map(name => `mission-reporter-${name}`);

  return await createMcpHandler((server) => {
    astrodogPrompts.concat(astrodogMissionReportPrompts).forEach(name => {
      server.prompt(
        `prompt-${name}`,
        `Get the prompt named '${name}'`,
        {},
        async (): Promise<GetPromptResult> => {
          const promptResponse = await promptManager.getPrompt({ name });
          return {
            messages: [
              {
                role: "assistant",
                content: {
                  type: "text",
                  text: JSON.stringify(promptResponse, null, 2)
                }
              }
            ]
          };
        }
      )
    });

    // ────────────────────────────────────────────────────────────────────────────
    // High-level reasoning prompts                                             
    // These are consumed by the MCP agent (not end-users) and explain **when**
    // and **how** to call the corresponding tools that are registered below.
    // They are grounded in the Langfuse prompt-management API semantics: see
    // https://langfuse.com/docs/prompts/get-started and the TypeScript SDK docs.
    // ────────────────────────────────────────────────────────────────────────────

    // 1. Publish an existing prompt version to production (i.e. add the
    //    "production" label to that version).
    server.prompt(
      "publish-to-production",
      "Publish a prompt version to the \"production\" label",
      {},
      async (): Promise<GetPromptResult> => {
        return {
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text:
                  [
                    "Your task: deploy a specific prompt version to production in a Langfuse project.",
                    "\n\n",
                    "Step-by-step:\n",
                    "1. Ensure you know the *exact* prompt name and desired version.  If unsure, first call the `listPrompts` tool (no args) or `getPrompt` to inspect a single prompt.\n",
                    "2. Call the `updateLabels` tool with:\n",
                    "   • name   – the prompt name\n",
                    "   • version – the integer version to publish\n",
                    "   • newLabels – an array that *must* include the string \"production\"  (you can keep existing labels too).\n",
                    "Example JSON args:\n",
                    '{ "name": "movie-critic", "version": 3, "newLabels": ["production", "latest"] }',
                    "\n\n",
                    "A successful call returns the full updated Prompt object (see Langfuse JS types `ApiPrompt`).\n",
                    "Only call `updateLabels` after you have verified the version number exists."
                  ].join("")
              }
            }
          ]
        };
      }
    );

    // 2. List all prompts with their versions/labels.
    server.prompt(
      "how-to-list-prompts",
      "Instruction to list all prompts",
      {},
      async (): Promise<GetPromptResult> => {
        return {
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text:
                  "To inspect every prompt in the Langfuse project (names, versions, labels), invoke the `listPrompts` tool.  It takes **no** arguments and echoes the API response which adheres to `PromptMetaListResponse` (array under `data`)."
              }
            }
          ]
        };
      }
    );

    // 3. Retrieve a single prompt (optionally by version or label).
    server.prompt(
      "how-to-get-prompt",
      "Instruction to fetch a single prompt",
      {},
      async (): Promise<GetPromptResult> => {
        return {
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text:
                  "Use the `getPrompt` tool when you need the full content of one prompt.  Required arg: `name`.  Optional: `version` (integer) *or* `label` (string such as \"production\", \"latest\").  Omit both to retrieve the production version."
              }
            }
          ]
        };
      }
    );

    // 4. Create a brand-new prompt or a new version for an existing name.
    server.prompt(
      "how-to-create-prompt",
      "Instruction to create a prompt (text or chat)",
      {},
      async (): Promise<GetPromptResult> => {
        return {
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text:
                  [
                    "To create a prompt (new name or new version) call the `createPrompt` tool.  Pass a JSON body that matches `CreatePromptRequestSchema`.\n",
                    "Key fields:\n",
                    "• type   – \"text\" or \"chat\".\n",
                    "• name   – unique prompt name.\n",
                    "• prompt – string *or* array of ChatMessage objects.\n",
                    "• labels – include \"production\" to deploy immediately, or leave empty to just store the version.\n",
                    "• config / tags / commitMessage – optional metadata.\n",
                    "Example minimal text prompt:\n",
                    '{ "type": "text", "name": "greeting", "prompt": "Hello {{name}}" }'
                  ].join("")
              }
            }
          ]
        };
      }
    );

    server.tool(
      "list_prompts",
      "List all prompts in the Langfuse project",
      {
        args: z.object({}).describe("No arguments"),
      },
      async () => {
        try {
          const prompts = await promptManager.listPrompts();
          return {
            content: [{ type: "text", text: JSON.stringify(prompts, null, 2) }],
            isError: false,
          }
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error listing prompts: ${error}` }],
            isError: true,
          }
        }
      }
    );

    server.tool(
      "create_prompt",
      "Create a new prompt in the Langfuse project",
      {
        prompt: CreatePromptRequestSchema,
      },
      async ({ prompt }: { prompt: CreatePromptRequest }) => {
        try {
          const createdPrompt = await promptManager.createPrompt(prompt);
          return {
            content: [{ type: "text", text: JSON.stringify(createdPrompt, null, 2) }],
            isError: false,
          }
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error creating prompt: ${error}` }],
            isError: true,
          }
        }
      }
    );

    server.tool(
      "get_prompt",
      "Get a prompt from the Langfuse project",
      {
        name: z.string().min(1).describe("The name of the prompt to get"),
        version: z.number().optional().describe("The version of the prompt to get. Defaults to the latest version."),
        label: z.string().optional().describe("The label of the prompt to get. Defaults to 'production' if version is not provided."),
      },
      async ({ name, version, label }) => {
        try {
          const prompt = await promptManager.getPrompt({ name, version, label });
          return {
            content: [{ type: "text", text: JSON.stringify(prompt, null, 2) }],
            isError: false,
          }
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error getting prompt: ${error}` }],
            isError: true,
          }
        }
      }
    )

    server.tool(
      "update_labels",
      "Update the labels of a prompt",
      {
        name: z.string().min(1).describe("The name of the prompt to publish"),
        version: z.number().min(1).describe("The version of the prompt to publish"),
        newLabels: z.array(z.string()).describe("The new labels of the prompt to publish."),
      },
      async ({ name, version, newLabels }) => {
        try {
          const updatedPrompt = await promptManager.updatePrompt({
            name,
            version,
            newLabels,
          });

          return {
            content: [{ type: "text", text: JSON.stringify(updatedPrompt, null, 2) }],
            isError: false,
          }
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error updating labels: ${error}` }],
            isError: true,
          }
        }
      }
    )
  })(request);
}

export { handleRequest as GET, handleRequest as POST, handleRequest as DELETE };