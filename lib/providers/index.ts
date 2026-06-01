import { githubTrendingProvider } from "@/lib/providers/githubTrending";
import { redditProvider } from "@/lib/providers/reddit";
import { xApifyProvider } from "@/lib/providers/xApify";

export const providers = [githubTrendingProvider, xApifyProvider, redditProvider];
