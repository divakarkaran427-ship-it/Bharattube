const formatViews = (views = 0) => {
  if (views < 1000) {
    return `${views}`;
  }

  if (views < 1000000) {
    return `${(views / 1000).toFixed(1).replace(".0", "")}K`;
  }

  if (views < 1000000000) {
    return `${(views / 1000000).toFixed(1).replace(".0", "")}M`;
  }

  return `${(views / 1000000000).toFixed(1).replace(".0", "")}B`;
};

export default formatViews;