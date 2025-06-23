const createPromptEndpoint = (baseUrl: string) => {
    return `${baseUrl}/api/public/v2/prompts`;
}

const listPromptsEndpoint = (baseUrl: string) => {
    return `${baseUrl}/api/public/v2/prompts`;
}

const getPromptEndpoint = (baseUrl: string, name: string, version?: number, label?: string) => {
    const url = new URL(`/api/public/v2/prompts/${name}`, baseUrl);
    if (version) url.searchParams.set("version", version.toString());
    if (label) url.searchParams.set("label", label);

    return url.toString();
}

const updatePromptEndpoint = (baseUrl: string, name: string, version: number) => {
    return `${baseUrl}/api/public/v2/prompts/${name}/versions/${version}`;
}

export const PromptEndpoints = {
    create: createPromptEndpoint,
    list: listPromptsEndpoint,
    get: getPromptEndpoint,
    update: updatePromptEndpoint,
}