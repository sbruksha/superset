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
  host: Host;
  protocol: Protocol;
  username: string;
  password: string;
  port: number;
};

export const RootContextProviders: React.FC<AuthProps> = ({
  host,
  protocol,
  username,
  password,
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
      const data = await postData(
        `${protocol}//${host}:${port}/api/v1/security/login`,
        {
          password,
          provider: 'db',
          refresh: true,
          username,
        },
      );
      const response = await fetch(
        `${protocol}//${host}:${port}/api/v1/security/csrf_token/`,
        {
          mode: 'cors',
          credentials: 'include',
          headers: { Authorization: `Bearer ${data.access_token}` },
        },
      );
      const csrf = await response.json();
      try {
        await postFormData(`${protocol}//${host}:${port}/login/`, {
          username,
          password,
          csrf_token: csrf.result,
        });
      } catch (error) {
        console.error(error);
      }
      setupClient({
        protocol,
        host: `${host}:${port}`,
        mode: 'cors',
        credentials: 'include',
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setIsReady(true);
    };
    handleAuth();
  }, [host, password, protocol, username, port]);
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
async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
  return response.json();
}
async function postFormData(url = '', data = {}) {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, element]: [string, string]) =>
    formData.append(key, element),
  );
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    body: formData,
  });
  return response.json(); // parses JSON response into native JavaScript objects
}
