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
import { BrowserRouter as Router } from 'react-router-dom';
import DashboardEmbed from 'src/dashboard_embed/';

const prefix = 'superset_dashboard_';
const dashboardSettingsKeys = {
  host: `${prefix}host`,
  port: `${prefix}port`,
  protocol: `${prefix}protocol`,
  token: `${prefix}token`,
  idOrSlug: `${prefix}idOrSlug`,
};

const App = () => {
  const isTemp = true;
  const storage = isTemp ? sessionStorage : localStorage;

  return (
    <Router>
      <DashboardEmbed
        host={storage.getItem(dashboardSettingsKeys.host) || 'localhost'}
        port={Number(storage.getItem(dashboardSettingsKeys.port)) || 8088}
        protocol={
          (storage.getItem(dashboardSettingsKeys.protocol) as any) || 'http:'
        }
        token={storage.getItem(dashboardSettingsKeys.token) || 'test-token'}
        idOrSlug={storage.getItem(dashboardSettingsKeys.idOrSlug) || '1'}
      />
    </Router>
  );
};

export default App;
