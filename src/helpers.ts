export function validateUrl(url: string): string {
    // Validate URL
    try {
        new URL(url)
    } catch (e) {
        throw new Error("Invalid Blog URL")
    }

    // Strip trailing slash
    return url.replace(/\/$/, "")
}