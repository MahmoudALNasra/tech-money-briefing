export type {
  OwnerVoiceRewriteOptions,
  OwnerVoiceRewriteResult
} from "../../scripts/rewrite-articles-owner-voice";

export {
  listPendingOwnerVoiceArticles,
  runOwnerVoiceRewrite as runOwnerVoiceOnNewestArticles
} from "../../scripts/rewrite-articles-owner-voice";
