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
import { hot } from 'react-hot-loader/root';
import { ThemeProvider } from '@superset-ui/core';
import setupApp from '../setup/setupApp';
import setupPlugins from '../setup/setupPlugins';
import { DynamicPluginProvider } from '../components/DynamicPlugins';
import AddSliceContainer from './AddSliceContainer';
import { initFeatureFlags } from '../featureFlags';
import { theme } from '../preamble';

setupApp();
setupPlugins();

const addSliceContainer = document.getElementById('superset_embed_dashboard');
const bootstrapData = JSON.parse(
  addSliceContainer?.getAttribute('data-bootstrap') || '{}',
);

initFeatureFlags(bootstrapData.common.feature_flags);

const App = () => (
  <ThemeProvider theme={theme}>
    <DynamicPluginProvider>
      <AddSliceContainer />
    </DynamicPluginProvider>
  </ThemeProvider>
);

export default hot(App);
