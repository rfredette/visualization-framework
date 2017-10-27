import React from "react";
import ReactDOM from "react-dom";
import $ from "jquery";
import CopyToClipboard from 'react-copy-to-clipboard';
import { connect } from "react-redux";
import { Link } from "react-router";
import { CardOverlay } from "../CardOverlay";
import { Card } from 'material-ui/Card';
import Visualization from "../Visualization";
import { contextualize } from "../../utils/configurations"

import {
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

import { resizeVisualization } from "../../utils/resize"
import style from "./styles"
import FontAwesome from "react-fontawesome";


class CompositeView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showDescription: false,
      showSharingOptions: false
    }
  }

  componentWillMount() {
    this.initialize(this.props.id);
  }

  componentDidMount = () => {
    const {
      registerResize,
      showInDashboard
    } = this.props;

    this.updateSize();

    // If present, register the resize callback
    // to respond to interactive resizes from react-grid-layout.
    if (registerResize) {
      registerResize(this.updateSize.bind(this))
    }

    // If we show the visualization only,
    // we need to listen to window events for resizing the graph
    if (!showInDashboard)
      window.addEventListener("resize", this.updateSize);
  }

  componentWillUnmount = () => {
    const {
      showInDashboard
    } = this.props;

    // Don't forget to remove the listener here
    if (!showInDashboard)
      window.removeEventListener("resize", this.updateSize);
  }

  componentWillReceiveProps(nextProps) {
    this.initialize(nextProps.id);
  }

  componentDidUpdate() {
    this.updateSize();
  }

  updateSize = () => {
    const {
      context,
      showInDashboard
    } = this.props;

    if (this._element) {
      const { width, height } = resizeVisualization(this._element, showInDashboard, context && context.hasOwnProperty("fullScreen"));

      if (width !== this.state.width || height !== this.state.height) {
        this.setState({ width, height });
      }
    }
  }

  initialize(id) {
     
    this.props.fetchConfigurationIfNeeded(id).then((c) => {
      const {
        configuration,
        showInDashboard,
        setPageTitle
      } = this.props;

      if (!configuration)
        return;

      if (!showInDashboard)
        setPageTitle("Visualization");
    });
  }

  getVisualizations() {
    const {
      id,
      configuration
    } = this.props;

    return configuration.visualizations ? configuration.visualizations : [{"id": id}]
  }

  renderVisualizationIfNeeded() {
    const visualizations = this.getVisualizations();

    return (
      <Visualization
        visualizations={visualizations}
        height={this.state.height}
        width={this.state.width}
      />
    )

  }

  shouldShowTitleBar() {
    const { configuration } = this.props;

    return configuration && configuration.title && configuration.showTitleBar !== false;
  }

  renderDescriptionIcon() {
    const { configuration } = this.props;

    if (!configuration.description)
      return;

    return (
      <FontAwesome
        name="info"
        style={style.cardTitleIcon}
        onTouchTap={() => { this.setState({ showDescription: !this.state.showDescription }); }}
      />
    )
  }

  renderShareIcon() {
    const {
      configuration,
      context
    } = this.props;

    if (!configuration || context.hasOwnProperty("fullScreen"))
      return;

    return (
      <FontAwesome
        name="share-alt"
        style={style.cardTitleIcon}
        onTouchTap={() => { this.setState({ showSharingOptions: !this.state.showSharingOptions }); }}
      />
    )
  }

  renderDownloadIcon() {
    return null;
    /*const {
      queryConfiguration,
      configuration,
      response
    } = this.props;

    if (!configuration || !response) {
      return false;
    }

    const data = ServiceManager.tabify(queryConfiguration, response.results);

    if (!data || !data.length) {
      return null;
    }

    return (
      <CSVLink data={data} filename={`${configuration.title ? configuration.title : 'data'}.csv`} >
        <FontAwesome
          name="cloud-download"
          style={style.cardTitleIcon}
        />
      </CSVLink>
    )*/
  }

  renderTitleBarIfNeeded() {
    if (!this.shouldShowTitleBar())
      return;

    return (
      <div style={style.cardTitle}>
        <div className="pull-right">
          {this.renderDescriptionIcon()}
          {this.renderShareIcon()}
          {this.renderDownloadIcon()}
        </div>
        <div>
          {this.props.configuration.title}
        </div>
      </div>
    )
  }

  renderSharingOptions() {
    if (!this.state.showSharingOptions)
      return;

    const {
      configuration,
      context
    } = this.props;


    const queryParams = Object.assign({}, context, { fullScreen: null });
    const queryString = $.param(queryParams);
    const iframeText = "<iframe src=\"" + window.location.origin + "/reports/visualizations/" + configuration.id + "?" + queryString + "\" width=\"800\" height=\"600\"></iframe>";

    return (
      <div
        className="text-center"
        style={style.sharingOptionsContainer}
      >
        <CopyToClipboard
          text={iframeText}
          style={style.copyContainer}
        >
          <button className="btn btn-default btn-xs">
            <FontAwesome name="copy" /> Copy iframe source
        </button>
        </CopyToClipboard>&nbsp;

      <Link
          style={style.cardTitleIcon}
          to={{ pathname: "/reports/visualizations/" + configuration.id, query: queryParams }}
          target="_blank"
        >
          <button className="btn btn-default btn-xs">
            <FontAwesome name="external-link" /> Open new window
        </button>
        </Link>
      </div>
    )
  }

  cardTextReference = (c) => {
    if (this._element)
      return;

    this._element = ReactDOM.findDOMNode(c).parentElement;
  }

  render() {
    const {
      configuration,
    } = this.props;

    if (!configuration)
      return (<div></div>);

    let description;

    if (this.state.showDescription) {
      description = <CardOverlay
        overlayStyle={style.descriptionContainer}
        textStyle={style.descriptionText}
        text={configuration.description}
        onTouchTapOverlay={() => { this.setState({ showDescription: false }); }}
      />
    }


    const configStyle = configuration.styles || {};

    return (
      <Card
        style={Object.assign({}, style.card, configStyle.card)}
        containerStyle={style.cardContainer}
        ref={this.cardTextReference}
      >
        {this.renderTitleBarIfNeeded()}
        <div>
          {this.renderSharingOptions()}
          {this.renderVisualizationIfNeeded()}
          {description}
          
          
          
        </div>
      </Card>
    );
  }
}

const updateFilterOptions = (state, configurations, context) => {
  if (configurations && configurations.filterOptions) {
    for (let key in configurations.filterOptions) {
      if (configurations.filterOptions[key].type) {
        if (context && context.enterpriseID) {
          let nsgs = state.services.getIn([ServiceActionKeyStore.REQUESTS, `enterprises/${context.enterpriseID}/${configurations.filterOptions[key].name}`, ServiceActionKeyStore.RESULTS]);

          if (nsgs && nsgs.length) {
            configurations.filterOptions[key].options = [];
            configurations.filterOptions[key].default = nsgs[0].name;

            nsgs.forEach((nsg) => {
              configurations.filterOptions[key].options.push({
                label: nsg.name,
                value: nsg.name
              });
            });
          }
        }
      }
    };
  }
  return configurations;
}

const mapStateToProps = (state, ownProps) => {  

 
  const configurationID =  ownProps.id || ownProps.params.id,
    context = state.interface.get(InterfaceActionKeyStore.CONTEXT),
    configuration = state.configurations.getIn([
      ConfigurationsActionKeyStore.VISUALIZATIONS,
      configurationID,
      ConfigurationsActionKeyStore.DATA
    ]);

  const props = {
    id: configurationID,
    context: context,
    configuration: configuration ? configuration.toJS() : null,
    error: state.configurations.getIn([
      ConfigurationsActionKeyStore.VISUALIZATIONS,
      configurationID,
      ConfigurationsActionKeyStore.ERROR
    ])
  };

  let vizConfig = configuration ? contextualize(configuration.toJS(), context) : null;
  props.configuration = updateFilterOptions(state, vizConfig, context);

  return props;
};

const actionCreators = (dispatch) => ({

  setPageTitle: function (aTitle) {
    dispatch(InterfaceActions.updateTitle(aTitle));
  },

  fetchConfigurationIfNeeded: function (id) {
    return dispatch(ConfigurationsActions.fetchIfNeeded(
      id,
      ConfigurationsActionKeyStore.VISUALIZATIONS
    ));
  },
});


export default connect(mapStateToProps, actionCreators)(CompositeView);
