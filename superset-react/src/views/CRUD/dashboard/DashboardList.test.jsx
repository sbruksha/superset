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
import { MemoryRouter } from 'react-router-dom';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import { Provider } from 'react-redux';
import * as featureFlags from 'src/featureFlags';

import waitForComponentToPaint from 'spec/helpers/waitForComponentToPaint';
import { styledMount as mount } from 'spec/helpers/theming';
import { render, screen, cleanup } from 'spec/helpers/testing-library';
import userEvent from '@testing-library/user-event';
import { QueryParamProvider } from 'use-query-params';
import { act } from 'react-dom/test-utils';

import ConfirmStatusChange from 'src/components/ConfirmStatusChange';
import DashboardList from 'src/views/CRUD/dashboard/DashboardList';
import ListView from 'src/components/ListView';
import ListViewCard from 'src/components/ListViewCard';
import PropertiesModal from 'src/dashboard_embed/components/PropertiesModal';

// store needed for withToasts(DashboardTable)
const mockStore = configureStore([thunk]);
const store = mockStore({});

const dashboardsInfoEndpoint = 'glob:*/api/v1/dashboard/_info*';
const dashboardOwnersEndpoint = 'glob:*/api/v1/dashboard/related/owners*';
const dashboardCreatedByEndpoint =
  'glob:*/api/v1/dashboard/related/created_by*';
const dashboardFavoriteStatusEndpoint =
  'glob:*/api/v1/dashboard/favorite_status*';
const dashboardsEndpoint = 'glob:*/api/v1/dashboard/?*';
const dashboardEndpoint = 'glob:*/api/v1/dashboard/*';

const mockDashboards = [...new Array(3)].map((_, i) => ({
  id: i,
  url: 'url',
  dashboard_title: `title ${i}`,
  changed_by_name: 'user',
  changed_by_url: 'changed_by_url',
  changed_by_fk: 1,
  published: true,
  changed_on_utc: new Date().toISOString(),
  changed_on_delta_humanized: '5 minutes ago',
  owners: [{ id: 1, first_name: 'admin', last_name: 'admin_user' }],
  roles: [{ id: 1, name: 'adminUser' }],
  thumbnail_url: '/thumbnail',
}));

const mockUser = {
  userId: 1,
};

fetchMock.get(dashboardsInfoEndpoint, {
  permissions: ['can_read', 'can_write'],
});
fetchMock.get(dashboardOwnersEndpoint, {
  result: [],
});
fetchMock.get(dashboardCreatedByEndpoint, {
  result: [],
});
fetchMock.get(dashboardFavoriteStatusEndpoint, {
  result: [],
});

fetchMock.get(dashboardsEndpoint, {
  result: mockDashboards,
  dashboard_count: 3,
});

fetchMock.get(dashboardEndpoint, {
  result: mockDashboards[0],
});

global.URL.createObjectURL = jest.fn();
fetchMock.get('/thumbnail', { body: new Blob(), sendAsJson: false });

describe('DashboardList', () => {
  const isFeatureEnabledMock = jest
    .spyOn(featureFlags, 'isFeatureEnabled')
    .mockImplementation(feature => feature === 'LISTVIEWS_DEFAULT_CARD_VIEW');

  afterAll(() => {
    isFeatureEnabledMock.restore();
  });

  const mockedProps = {};
  const wrapper = mount(
    <MemoryRouter>
      <Provider store={store}>
        <DashboardList {...mockedProps} user={mockUser} />
      </Provider>
    </MemoryRouter>,
  );

  beforeAll(async () => {
    await waitForComponentToPaint(wrapper);
  });

  it('renders', () => {
    expect(wrapper.find(DashboardList)).toExist();
  });

  it('renders a ListView', () => {
    expect(wrapper.find(ListView)).toExist();
  });

  it('fetches info', () => {
    const callsI = fetchMock.calls(/dashboard\/_info/);
    expect(callsI).toHaveLength(1);
  });

  it('fetches data', () => {
    wrapper.update();
    const callsD = fetchMock.calls(/dashboard\/\?q/);
    expect(callsD).toHaveLength(1);
    expect(callsD[0][0]).toMatchInlineSnapshot(
      `"http://localhost/api/v1/dashboard/?q=(order_column:changed_on_delta_humanized,order_direction:desc,page:0,page_size:25)"`,
    );
  });

  it('renders a card view', () => {
    expect(wrapper.find(ListViewCard)).toExist();
  });

  it('renders a table view', async () => {
    wrapper.find('[aria-label="list-view"]').first().simulate('click');
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find('table')).toExist();
  });

  it('edits', async () => {
    expect(wrapper.find(PropertiesModal)).not.toExist();
    wrapper.find('[data-test="edit-alt"]').first().simulate('click');
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(PropertiesModal)).toExist();
  });

  it('card view edits', async () => {
    wrapper.find('[data-test="edit-alt"]').last().simulate('click');
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(PropertiesModal)).toExist();
  });

  it('delete', async () => {
    wrapper
      .find('[data-test="dashboard-list-trash-icon"]')
      .first()
      .simulate('click');
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(ConfirmStatusChange)).toExist();
  });

  it('card view delete', async () => {
    wrapper
      .find('[data-test="dashboard-list-trash-icon"]')
      .last()
      .simulate('click');
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(ConfirmStatusChange)).toExist();
  });
});

describe('RTL', () => {
  async function renderAndWait() {
    const mounted = act(async () => {
      const mockedProps = {};
      render(
        <MemoryRouter>
          <QueryParamProvider>
            <DashboardList {...mockedProps} user={mockUser} />
          </QueryParamProvider>
        </MemoryRouter>,
        { useRedux: true },
      );
    });

    return mounted;
  }

  let isFeatureEnabledMock;
  beforeEach(async () => {
    isFeatureEnabledMock = jest
      .spyOn(featureFlags, 'isFeatureEnabled')
      .mockImplementation(() => true);
    await renderAndWait();
  });

  afterEach(() => {
    cleanup();
    isFeatureEnabledMock.mockRestore();
  });

  it('renders an "Import Dashboard" tooltip under import button', async () => {
    const importButton = await screen.findByTestId('import-button');
    userEvent.hover(importButton);

    await screen.findByRole('tooltip');
    const importTooltip = screen.getByRole('tooltip', {
      name: 'Import dashboards',
    });

    expect(importTooltip).toBeInTheDocument();
  });
});
