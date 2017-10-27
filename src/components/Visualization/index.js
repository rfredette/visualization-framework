import React from "react";
import safeEval from "cross-safe-eval"

import { connect } from "react-redux";
import { push } from "redux-router";
import ReactInterval from 'react-interval';
import FiltersToolBar from "../FiltersToolBar";
import NextPrevFilter from "../NextPrevFilter";
import * as d3 from "d3";
import { CardText } from 'material-ui/Card';
import { labelWidth } from '../Helpers/labelWidth';
import { legendWidth } from '../Helpers/legendWidth';
import _ from "lodash";

import { extent, min, max } from "d3";

import {
  Actions as ServiceActions,
  ActionKeyStore as ServiceActionKeyStore
} from "../../services/servicemanager/redux/actions";

import {
  Actions as ConfigurationsActions,
  ActionKeyStore as ConfigurationsActionKeyStore
} from "../../services/configurations/redux/actions";

import {
  Actions as InterfaceActions,
  ActionKeyStore as InterfaceActionKeyStore,
} from "../App/redux/actions";

import { contextualize } from "../../utils/configurations"
import { CardOverlay } from "../CardOverlay";
import style from "./styles"
import FontAwesome from "react-fontawesome";

import { GraphManager } from "../Graphs/index";
import { ServiceManager } from "../../services/servicemanager/index";

class VisualizationView extends React.Component {

  constructor(props) {
    super(props);
    this.range        = {};
    this.state        = {
      parameterizable: true,
    };
  }

  componentWillMount() {
    this.initialize(this.props.visualizations);
  }

  componentWillReceiveProps(nextProps) {
    this.initialize(nextProps.visualizations);
  }

  initialize(visualizations) {

    visualizations.map(visualization => {
      
      this.props.fetchConfigurationIfNeeded(visualization.id).then((c) => {
        const {
          configuration,
          context,
          queryConfiguration
        } = this.props.graphs[visualization.id];

        if (!configuration)
          return;

        const queryName = configuration.query,
          scriptName = configuration.script;

        if (scriptName) {
          const { executeScriptIfNeeded } = this.props;
          executeScriptIfNeeded(scriptName, context);
        }

        if (queryName) {
          this.props.fetchQueryIfNeeded(queryName).then(() => {
            const { executeQueryIfNeeded } = this.props;
            if (!queryConfiguration)
              return;
            executeQueryIfNeeded(queryConfiguration, context).then(
              () => {
                  this.setState({
                      parameterizable: true,
                  });
              },
              (error) => {
                  this.setState({
                      parameterizable: false,
                  });
              }
            );

          });
        }

        // Handle configured listeners (e.g. navigate when clicking on a bar).
        if (configuration.listeners) {
          // Use this.state.listeners to store the listeners that will be
          // passed into the visualization components.
          this.setState({

            // This will be an object whose keys are event names,
            // and whose values are functions that accept the data object
            // corresponding to the clicked visual element.
            listeners: configuration.listeners.reduce((listeners, listener) => {
              // Use ES6 destructuring with defaults.
              const {

                // By default, use the "onMarkClick" event.
                event = "onMarkClick",

                redirect,

                // By default, specify no date params.
                dateParams = false,

                // By default, specify no additional query params.
                params = {}
                          } = listener;

              // Each listener expects the data object `d`,
              // which corresponds to a row of data visualized.
              listeners[event] = (d) => {

                let graphQueryParams = {};
                let resetFilters = false;

                if (configuration.key) {
                  let visualizationId = `${visualization.replace(/-/g, '')}vkey`;
                  let vKey = safeEval("(" + configuration.key + ")")(d);
                  if (this.props.orgContext[visualizationId] === vKey)
                    resetFilters = true;

                  graphQueryParams[visualizationId] = vKey;
                }


                if (dateParams) {
                  let filteredID = (dateParams.reference).replace(/-/g, '');
                  graphQueryParams[`${filteredID}endTime`] = +d[dateParams.column] + dateParams.duration;
                  graphQueryParams[`${filteredID}startTime`] = +d[dateParams.column] - dateParams.duration;
                }

                // Compute the query params from the data object.
                let queryParams = Object.keys(params)
                  .reduce((queryParams, destinationParam) => {
                    const sourceColumn = params[destinationParam];
                    queryParams[destinationParam] = d[sourceColumn];
                    return queryParams;
                  }, {});

                let mergedQueryParams = Object.assign({}, queryParams, graphQueryParams);
                // Override the existing context with the new params.
                queryParams = Object.assign({}, this.props.orgContext, mergedQueryParams);

                if (resetFilters) {
                  for (let key in mergedQueryParams) {
                    if (mergedQueryParams.hasOwnProperty(key)) {
                      queryParams[key] = '';
                    }
                  }
                }

                let url;

                // By default, stay on the current route.
                if (!redirect)
                  url = window.location.pathname;
                else
                  url = process.env.PUBLIC_URL + redirect;

                // Perform the navigation via react-router.
                this.props.goTo(url, queryParams);
              };

              return listeners;
            }, {})
          });

        }
      });
    });
  }

  renderCardWithInfo(message, iconName, spin = false) {

    return (
      <CardOverlay
        overlayStyle={style.overlayContainer}
        textStyle={style.overlayText}
        text={(
          <div style={style.fullWidth}>
            <FontAwesome
              name={iconName}
              size="2x"
              spin={spin}
            />
            <br></br>
            {message}
          </div>
        )}
      />
    )
  }

  renderFiltersToolBar(props) {
    const {
      configuration,
      configurationID
    } = props;

    if (!configuration || !configuration.filterOptions)
      return;

    return (
      <FiltersToolBar filterOptions={configuration.filterOptions} visualizationId={configurationID} />
    )
  }

  renderNextPrevFilter(props) {
    const {
      configuration,
      configurationID
    } = props;

    if (!configuration || !configuration.nextPrevFilter)
      return;

    return (
      <NextPrevFilter nextPrevFilter={configuration.nextPrevFilter} visualizationId={configurationID} />
    )
  }

  renderVisualization(props) {

    const {
      configuration,
      configurationID,
      data
    } = props;

    if(!data || !data.length) {
      return this.renderCardWithInfo("No data to visualize", "bar-chart");
    }

    const graphName      = configuration.graph,
          GraphComponent = GraphManager.getGraphComponent(graphName),
          height         = this.calculateHeight(configurationID);

    let properties = {}
    if(this.isComposite(configurationID)) {
      properties = this.isPrimary(configurationID) ?
                      this.getPrimaryProperties() : this.getSecondaryProperties();
    }  

    return (
      <GraphComponent
        data={data}
        context={this.props.orgContext}
        configuration={configuration}
        width={this.props.width}
        height={height}
        properties={Object.assign({}, this.getCommonProperties(), properties)}
        goTo={this.props.goTo}
        {...this.state.listeners}
      />
    )
  }

  isComposite() {
    const {
      visualizations
    } = this.props;

    return visualizations.length > 1;
  }

  isPrimary(configurationID) {
    const {
      visualizations
    } = this.props;

    return visualizations[0].id === configurationID
  }

  getPrimaryProperties() {
    return {
      margin: { top: 0, bottom: 0, left: 10, right: 10},
      chartHeightToPixel: 3,
      xAxisHeight: 0,
      hideXAxis: true,
    }
  }

  getSecondaryProperties() {
    return {}
  }

  getCommonProperties() {
    const {
      yLabelWidth,
      legendWidth
    } = this.props;

    return {
      yLabelWidth: yLabelWidth,
      legendWidth: legendWidth
    }
  }

  calculateHeight(configurationID, style) {

    let height = this.props.height;
    
    if(this.isComposite()) { 
        height = this.props.height * (this.isPrimary(configurationID) ? 0.50 : 0.50); 
    }
    
    let chartHeight =  d3.select(`#filter_${configurationID}`).node() ?
         height - d3.select(`#filter_${configurationID}`).node().getBoundingClientRect().height : height;
    
    if(!chartHeight) 
      chartHeight = 0;

    return style ? Object.assign({}, style, {
      height: chartHeight,
    }) : chartHeight;
    
  }

  renderGraph() {
    const {
      visualizations
    } = this.props;

    let cardStyle = Object.assign({}, style.cardText, {
      width: this.props.width,
    });


    return visualizations.map(visualization => {
      const {
        configuration,
        context,
        configurationID
      } = this.props.graphs[visualization.id];

      let refreshInterval = context.refreshInterval,
        timeout = parseInt((configuration && configuration.refreshInterval) || refreshInterval, 10),
        enabled = refreshInterval > 0,
        id      = this.props.graphs[visualization.id];
    
      return (
        <div key={configurationID}>
          <div id={`filter_${configurationID}`}>
            {this.renderNextPrevFilter(id)}
            {this.renderFiltersToolBar(id)}
            <div className="clearfix"></div>
          </div>

          <CardText style={this.calculateHeight(configurationID, cardStyle)}>
            {this.renderVisualization(id)}
            <ReactInterval
              enabled={enabled}
              timeout={timeout}
              callback={() => { this.initialize() }}
            />
          </CardText>
        </div>
      );
    });
  }

  render() {
    const {
      error,
      isFetching,
      invalid
    } = this.props;
    
    if (error) {
      return this.renderCardWithInfo("Oops, " + error, "meh-o");
    }

    if(isFetching) {
      return this.renderCardWithInfo("Please wait while loading", "circle-o-notch", true);
    }

    if(invalid) {
      return this.renderCardWithInfo("Oops, no intersecting data found for this visualizations", "meh-o");
    }

    return (
      <div>
        {this.renderGraph()}
      </div>
    )
  }
}



const mapStateToProps = (state, ownProps) => {

  const visualizations = ownProps.visualizations,
    orgContext = state.interface.get(InterfaceActionKeyStore.CONTEXT);

  let props = {
    error: false,
    isFetching: false,
    invalid: false,
    graphs: {},
    yLabelWidth: 0,
    legendWidth: 0,
  };
  
  visualizations.forEach(visualization => {
    
    let isFetching = true;

    const configuration = state.configurations.getIn([
      ConfigurationsActionKeyStore.VISUALIZATIONS,
      visualization.id,
      ConfigurationsActionKeyStore.DATA
    ]);    

    let context = {},
      filteredID = visualization.id.replace(/-/g, '');


    for (let key in orgContext) {
      if (orgContext.hasOwnProperty(key)) {

        let filteredKey = key.replace(`${filteredID}`, '');
        if (!context[filteredKey] || key.includes(`${filteredID}`))
          context[filteredKey] = orgContext[key];
      }
    }

    let properties = {
      configurationID: visualization.id,
      context: context,
      orgContext: orgContext,
      configuration: configuration ? contextualize(configuration.toJS(), context) : null,
      error: state.configurations.getIn([
        ConfigurationsActionKeyStore.VISUALIZATIONS,
        visualization.id,
        ConfigurationsActionKeyStore.ERROR
      ])
    };

    // Expose the query template as a JS object if it is available.
    if (configuration) {
      let queryConfiguration = state.configurations.getIn([
        ConfigurationsActionKeyStore.QUERIES,
        configuration.get("query")
      ]);

      if (queryConfiguration && !queryConfiguration.get(
        ConfigurationsActionKeyStore.IS_FETCHING
      )) {
        queryConfiguration = queryConfiguration.get(
          ConfigurationsActionKeyStore.DATA
        );

        properties.queryConfiguration = queryConfiguration ? queryConfiguration.toJS() : null;
      }

      const scriptName = configuration.get("script");

      // Expose received response if it is available
      if (properties.queryConfiguration || scriptName) {

        const query = properties.queryConfiguration ?
          properties.queryConfiguration : scriptName;


        const requestID = ServiceManager.getRequestID(query, context);     
        let response = state.services.getIn([
          ServiceActionKeyStore.REQUESTS,
          requestID
        ]);
        
        if (response) {
          let responseJS = response.toJS();
          
          if(responseJS.results) {
            isFetching = false;
            properties.data = ServiceManager.tabify(properties.queryConfiguration, responseJS.results);
          } else if(responseJS.error) {
            properties.error = responseJS.error;            
          }
        }
      }
    }

    props.graphs[visualization.id] = properties;

    if(properties.error) {
      props.error = properties.error;
    }

    if(isFetching) {
      props.isFetching = true;
    }

  });

  if(!props.isFetching && !props.error) {
    


    // For data truncate
    let ranges = [];
    _.forEach(props.graphs, graph => {
      if(visualizations.length === 2) {
        let dataConfiguration = graph.configuration.data;
        
        if(graph.data && dataConfiguration && dataConfiguration.xColumn) {
          ranges.push(extent(graph.data, d =>  d[dataConfiguration.xColumn]));
        }
      }
    })

    if(ranges.length === 2) {
      let startRange = max(ranges[0][0], ranges[1][0]);
      let endRange   = min(ranges[0][1], ranges[1][1]);

      _.forEach(props.graphs, graph => {
        let data = _.dropWhile(graph.data, (d) => d.ts < startRange);
        data = _.dropRightWhile(data, (d) => d.ts > endRange);
        
        if(!data || !data.length)
          props.invalid = true;

        graph.data = data;
      });
    }

    //For any visualization
    _.forEach(props.graphs, graph => {
       //To be removed
      if(_.size(props.graphs) === 2)
        graph.configuration.data.legend.orientation = 'vertical';

      let dataConfiguration = graph.configuration.data;

      let yLabelWidth = labelWidth(graph.data, dataConfiguration.yColumn, dataConfiguration.yTickFormat);       
      
      if (!props.yLabelWidth || props.yLabelWidth < yLabelWidth) {
        props.yLabelWidth = yLabelWidth;
      }

      let legend = legendWidth(graph.data, dataConfiguration.yColumn, dataConfiguration.yTickFormat); 
      
      if(!props.legendWidth || props.legendWidth < legend) {
        props.legendWidth = legend;
      }     
    });

  }

  return props;
};

const actionCreators = (dispatch) => ({

  setPageTitle: function (aTitle) {
    dispatch(InterfaceActions.updateTitle(aTitle));
  },

  goTo: function (link, context) {
    dispatch(push({ pathname: link, query: context }));
  },

  fetchConfigurationIfNeeded: function (id) {
    return dispatch(ConfigurationsActions.fetchIfNeeded(
      id,
      ConfigurationsActionKeyStore.VISUALIZATIONS
    ));
  },

  fetchQueryIfNeeded: function (id) {
    return dispatch(ConfigurationsActions.fetchIfNeeded(
      id,
      ConfigurationsActionKeyStore.QUERIES
    ));
  },

  executeQueryIfNeeded: function (queryConfiguration, context) {
    return dispatch(ServiceActions.fetchIfNeeded(queryConfiguration, context));
  },

  executeScriptIfNeeded: function (scriptName, context) {
    return dispatch(ServiceActions.fetchIfNeeded(scriptName, context));
  }

});

export default connect(mapStateToProps, actionCreators)(VisualizationView);
