/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SeriesEditor from '../series_editor';
import { IndexPattern } from '../index_pattern';
import createTextHandler from '../lib/create_text_handler';
import ColorRules from '../color_rules';
import ColorPicker from '../color_picker';
import uuid from 'uuid';
import YesNo from '../yes_no';
import { htmlIdGenerator } from '@elastic/eui';

class TopNPanelConfig extends Component {

  constructor(props) {
    super(props);
    this.state = { selectedTab: 'data' };
  }

  componentWillMount() {
    const { model } = this.props;
    const parts = {};
    if (!model.bar_color_rules || (model.bar_color_rules && model.bar_color_rules.length === 0)) {
      parts.bar_color_rules = [{ id: uuid.v1() }];
    }
    this.props.onChange(parts);
  }

  switchTab(selectedTab) {
    this.setState({ selectedTab });
  }

  render() {
    const { selectedTab } = this.state;
    const defaults = { drilldown_url: '', filter: '' };
    const model = { ...defaults, ...this.props.model };
    const htmlId = htmlIdGenerator();
    const handleTextChange = createTextHandler(this.props.onChange);
    let view;
    if (selectedTab === 'data') {
      view = (
        <SeriesEditor
          colorPicker={false}
          fields={this.props.fields}
          model={this.props.model}
          name={this.props.name}
          onChange={this.props.onChange}
        />
      );
    } else {
      view = (
        <div className="vis_editor__container">
          <div className="vis_editor__vis_config-row">
            <label className="vis_editor__label" htmlFor={htmlId('itemUrl')}>
              Item Url (This supports mustache templating.
              <code>{'{{key}}'}</code> is set to the term)
            </label>
            <input
              id={htmlId('itemUrl')}
              className="vis_editor__input-grows"
              onChange={handleTextChange('drilldown_url')}
              value={model.drilldown_url}
            />
          </div>
          <IndexPattern
            fields={this.props.fields}
            model={this.props.model}
            onChange={this.props.onChange}
          />
          <div className="vis_editor__vis_config-row">
            <div className="vis_editor__label">Background Color</div>
            <ColorPicker
              onChange={this.props.onChange}
              name="background_color"
              value={model.background_color}
            />
            <label className="vis_editor__label" htmlFor={htmlId('panelFilter')}>
              Panel Filter
            </label>
            <input
              id={htmlId('panelFilter')}
              className="vis_editor__input-grows"
              type="text"
              onChange={handleTextChange('filter')}
              value={model.filter}
            />
            <div className="vis_editor__label">Ignore Global Filter</div>
            <YesNo
              value={model.ignore_global_filter}
              name="ignore_global_filter"
              onChange={this.props.onChange}
            />
          </div>
          <div>
            <div className="vis_editor__label">Color Rules</div>
          </div>
          <div className="vis_editor__vis_config-row">
            <ColorRules
              model={model}
              primaryVarName="bar_color"
              primaryName="bar"
              hideSecondary={true}
              onChange={this.props.onChange}
              name="bar_color_rules"
            />
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="kbnTabs" role="tablist">
          <button
            role="tab"
            aria-selected={selectedTab === 'data'}
            className={`kbnTabs__tab${selectedTab === 'data' && '-active' || ''}`}
            onClick={() => this.switchTab('data')}
          >Data
          </button>
          <button
            role="tab"
            aria-selected={selectedTab === 'options'}
            className={`kbnTabs__tab${selectedTab === 'options' && '-active' || ''}`}
            onClick={() => this.switchTab('options')}
          >Panel Options
          </button>
        </div>
        {view}
      </div>
    );
  }

}

TopNPanelConfig.propTypes = {
  fields: PropTypes.object,
  model: PropTypes.object,
  onChange: PropTypes.func,
};

export default TopNPanelConfig;
