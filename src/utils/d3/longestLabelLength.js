import * as d3 from "d3";

export const longestLabelLength = ({data, label, formatter}) => {

  const padding = 1.2;
  if (!data.length)
    return padding;

  // Basic function if none provided
  if (!label)
    label = (d) => d;

  let format = (d) => d;

  if (formatter)
    format = d3.format(formatter);

  // Extract the longest legend according to the label function
  const lab = label(data.reduce((a, b) => {
    let labelA = label(a);
    let labelB = label(b);

    if (!labelA)
      return b;

    if (!labelB)
      return a;
    return format(labelA.toString()).length > format(labelB.toString()).length ? a : b;
  }));

  const longestLabel = lab ? lab.toString() : '';

  // and return its length + 1.2 to ensure we have enough space
  return format(longestLabel).length + padding;
}