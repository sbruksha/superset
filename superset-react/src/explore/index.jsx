/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import logger from '../middleware/loggerMiddleware';
import { initFeatureFlags } from '../featureFlags';
import { initEnhancer } from '../reduxUtils';
import getInitialState from './reducers/getInitialState';
import rootReducer from './reducers/index';
import App from './App';

const exploreViewContainer = document.getElementById(
  'superset_embed_dashboard',
);
const bootstrapData = JSON.parse(
  exploreViewContainer.getAttribute('data-bootstrap'),
);
initFeatureFlags(bootstrapData.common.feature_flags);
const initState = getInitialState(bootstrapData);
const store = createStore(
  rootReducer,
  initState,
  compose(applyMiddleware(thunk, logger), initEnhancer(false)),
);

ReactDOM.render(
  <App store={store} />,
  document.getElementById('superset_embed_dashboard'),
);
