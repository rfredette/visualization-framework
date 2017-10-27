import { longestLabelLength } from '../../utils/d3/longestLabelLength';

export const legendWidth = (data, column = null, formatter = null) => {
  let options = {
    data: [],
    label: null,
    formatter: null
  }

  let legendWidth = 0;
  if (column && data.length) {
    //Checking whehter we want to access values of key if a column only
    if (typeof column !== 'object') {

      options.data = data;
      options.label = (d) => {
        return d.column;
      }
      options.formatter = formatter;

    } else {
      options.data = column
    }
    legendWidth = longestLabelLength(options);
  }

  return legendWidth;
}