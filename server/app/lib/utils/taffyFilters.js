const TimeUnit = {
  MINUTE: 'm',
  HOURS: 'h',
  DAYS: 'd'
}

const Fields = {
  TIMESTAMP : "timestamp"
}

const convertIntoTimestamp = function (field) {
        let time = 0;
        let unit = 0;
        let params = {};
        let currentTime = Math.round((new Date()).getTime());

        for(let key in field) {

             if(!field[key].toString().includes("now")) {
                params[key] = field[key];
                continue;
             }

            let match = parseInt(field[key].match(/\d+/));
            time = isNaN(match) ? 0 : match;

            if(time) {
              switch (field[key].slice(-1)) {
                  case TimeUnit.DAYS:
                      unit = 24*60*60*1000;
                      break;
                  case TimeUnit.HOURS:
                      unit = 60*60*1000;
                      break;
                  default:
                      unit = 60*1000;
              }
            }

            params[key] = eval(currentTime - (time * unit));
        }

        return params;
}

const converter = function (parameters) {
  let params = {};
  for(let key in parameters) {
      let fieldType = parameters[key].fieldType;
      delete parameters[key].fieldType;
      switch (fieldType) {
          case Fields.TIMESTAMP:
              params[key] = convertIntoTimestamp(parameters[key]);
              break;
          default:
              params[key] = parameters[key]
      }
  }
  return params;
}

export const TaffyFilter = {
  converter: converter
}