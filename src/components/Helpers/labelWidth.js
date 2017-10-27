import { longestLabelLength } from '../../utils/d3/longestLabelLength';

export const labelWidth = (data = [], column = null, formatter = null) => {

  let options = {
    data: data,
    label: null,
    formatter: formatter
  }

  let labelWidth = 0;
  // Calculate yLableWidth for left margin
  if (column && options.data.length) {
    let columns = typeof column === 'object' ? column : [column]
    columns.forEach((column) => {
      options.label = (d) => d[column];
      let width = longestLabelLength(options);
      if (!labelWidth || labelWidth < width) {
        labelWidth = width;
      }
    })
  }
  return labelWidth;
}