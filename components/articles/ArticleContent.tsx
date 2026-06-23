import { Fragment, type ReactNode } from "react";

import {
  buildAutoLinkRulesForArticle,
  DEFAULT_AUTO_LINK_BUDGET,
  type ArticleAutoLinkBudget
} from "@/lib/article-auto-links";
import { renderArticleBlock } from "@/lib/article-markdown";
import type { Article } from "@/lib/types";

type ArticleContentProps = {
  article: Article;
  blocks: string[];
  inlineImageSlots?: Array<{
    index: number;
    node: ReactNode;
  }>;
};

export async function ArticleContent({
  article,
  blocks,
  inlineImageSlots = []
}: ArticleContentProps) {
  const autoLinkRules = await buildAutoLinkRulesForArticle(article);
  const autoLinkBudget: ArticleAutoLinkBudget = {
    ...DEFAULT_AUTO_LINK_BUDGET,
    hrefCounts: new Map()
  };
  const renderOptions = { autoLinkRules, autoLinkBudget };
  const imageByBlockIndex = new Map(
    inlineImageSlots.map((slot) => [slot.index, slot.node])
  );

  return (
    <>
      {blocks.map((block, index) => {
        const inlineImage = imageByBlockIndex.get(index);

        return (
          <Fragment key={`${block}-${index}`}>
            {renderArticleBlock(block, renderOptions)}
            {inlineImage}
          </Fragment>
        );
      })}
    </>
  );
}
