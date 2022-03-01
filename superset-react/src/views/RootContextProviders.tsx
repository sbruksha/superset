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
import { Host, Protocol, ThemeProvider } from '@superset-ui/core';
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider as ReduxProvider } from 'react-redux';
import { Route } from 'react-router-dom';
import { setLegacyClientSetting } from 'src/explore/exploreUtils';
import setupClient from 'src/setup/setupClient';
import { QueryParamProvider } from 'use-query-params';
import { DynamicPluginProvider } from '../components/DynamicPlugins';
import { EmbeddedUiConfigProvider } from '../components/UiConfigContext';
import { theme } from '../preamble';
import { store } from './store';

export type AuthProps = {
  host?: Host;
  protocol?: Protocol;
  token?: string;
  port?: number;
};

export const RootContextProviders: React.FC<AuthProps> = ({
  host,
  protocol,
  token,
  children,
  port,
}) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setLegacyClientSetting({
      host,
      port,
    });
    const handleAuth = async () => {
      const realPort = port ? `:${port}` : '';
      await postFormData(`${protocol}//${host}${realPort}/auth/`, { token });
      setupClient({
        protocol,
        host: `${host}${realPort}`,
        mode: 'cors',
        credentials: 'include',
      });
      setLegacyClientSetting({
        hostname: host,
        port: null,
        protocol,
      });
      setIsReady(true);
    };
    handleAuth();
  }, [host, protocol, token, port]);
  return (
    <ThemeProvider theme={theme}>
      <ReduxProvider store={store}>
        <DndProvider backend={HTML5Backend}>
          <EmbeddedUiConfigProvider>
            <DynamicPluginProvider>
              <QueryParamProvider
                ReactRouterRoute={Route}
                stringifyOptions={{ encode: false }}
              >
                {isReady && children}
              </QueryParamProvider>
            </DynamicPluginProvider>
          </EmbeddedUiConfigProvider>
        </DndProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
};

async function postFormData(url = '', data = {}) {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, element]: [string, string]) =>
    formData.append(key, element),
  );
  await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'include',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    body: formData,
  });
}
