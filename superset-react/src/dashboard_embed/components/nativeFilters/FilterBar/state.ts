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
/* eslint-disable no-param-reassign */
import { useSelector } from 'react-redux';
import { filter, keyBy } from 'lodash';
import {
  Filters,
  FilterSets as FilterSetsType,
} from 'src/dashboard_embed/reducers/types';
import {
  DataMaskState,
  DataMaskStateWithId,
  DataMaskWithId,
} from 'src/dataMask/types';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ChartsState, RootState } from 'src/dashboard_embed/types';
import { MigrationContext } from 'src/dashboard_embed/containers/DashboardPage';
import { FILTER_BOX_MIGRATION_STATES } from 'src/explore/constants';
import { Filter } from 'src/dashboard_embed/components/nativeFilters/types';
import { NATIVE_FILTER_PREFIX } from '../FiltersConfigModal/utils';

export const useFilterSets = () =>
  useSelector<any, FilterSetsType>(
    state => state.nativeFilters.filterSets || {},
  );

export const useFilters = () => {
  const preselectedNativeFilters = useSelector<any, Filters>(
    state => state.dashboardState?.preselectNativeFilters,
  );
  const nativeFilters = useSelector<any, Filters>(
    state => state.nativeFilters.filters,
  );
  return useMemo(
    () =>
      Object.entries(nativeFilters).reduce(
        (acc, [filterId, filter]: [string, Filter]) => ({
          ...acc,
          [filterId]: {
            ...filter,
            preselect: preselectedNativeFilters?.[filterId],
          },
        }),
        {} as Filters,
      ),
    [nativeFilters, preselectedNativeFilters],
  );
};

export const useNativeFiltersDataMask = () => {
  const dataMask = useSelector<RootState, DataMaskStateWithId>(
    state => state.dataMask,
  );

  return useMemo(
    () =>
      Object.values(dataMask)
        .filter((item: DataMaskWithId) =>
          String(item.id).startsWith(NATIVE_FILTER_PREFIX),
        )
        .reduce(
          (prev, next: DataMaskWithId) => ({ ...prev, [next.id]: next }),
          {},
        ) as DataMaskStateWithId,
    [dataMask],
  );
};

export const useFilterUpdates = (
  dataMaskSelected: DataMaskState,
  setDataMaskSelected: (arg0: (arg0: DataMaskState) => void) => void,
) => {
  const filters = useFilters();
  const dataMaskApplied = useNativeFiltersDataMask();
  useEffect(() => {
    // Remove deleted filters from local state
    Object.keys(dataMaskSelected).forEach(selectedId => {
      if (!filters[selectedId]) {
        setDataMaskSelected(draft => {
          delete draft[selectedId];
        });
      }
    });
  }, [dataMaskApplied, dataMaskSelected, filters, setDataMaskSelected]);
};

// Load filters after charts loaded
export const useInitialization = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const filters = useFilters();
  const filterboxMigrationState = useContext(MigrationContext);
  let charts = useSelector<RootState, ChartsState>(state => state.charts);

  // We need to know how much charts now shown on dashboard to know how many of all charts should be loaded
  let numberOfLoadingCharts = 0;
  if (!isInitialized) {
    // do not load filter_box in reviewing
    if (filterboxMigrationState === FILTER_BOX_MIGRATION_STATES.REVIEWING) {
      charts = keyBy(
        filter(charts, chart => chart.formData?.viz_type !== 'filter_box'),
        'id',
      );
      const numberOfFilterbox = document.querySelectorAll(
        '[data-test-viz-type="filter_box"]',
      ).length;

      numberOfLoadingCharts =
        document.querySelectorAll('[data-ui-anchor="chart"]').length -
        numberOfFilterbox;
    } else {
      numberOfLoadingCharts = document.querySelectorAll(
        '[data-ui-anchor="chart"]',
      ).length;
    }
  }
  useEffect(() => {
    if (isInitialized) {
      return;
    }

    if (Object.values(filters).find(({ requiredFirst }) => requiredFirst)) {
      setIsInitialized(true);
      return;
    }

    // For some dashboards may be there are no charts on first page,
    // so we check up to 1 sec if there is at least on chart to load
    let filterTimeout: NodeJS.Timeout;
    if (numberOfLoadingCharts === 0) {
      filterTimeout = setTimeout(() => {
        setIsInitialized(true);
      }, 1000);
    }

    // @ts-ignore
    if (numberOfLoadingCharts > 0 && filterTimeout !== undefined) {
      clearTimeout(filterTimeout);
    }

    const numberOfLoadedCharts = Object.values(charts).filter(
      ({ chartStatus }) => chartStatus !== 'loading',
    ).length;
    if (
      numberOfLoadingCharts > 0 &&
      numberOfLoadedCharts >= numberOfLoadingCharts
    ) {
      setIsInitialized(true);
    }
  }, [charts, isInitialized, numberOfLoadingCharts]);

  return isInitialized;
};
