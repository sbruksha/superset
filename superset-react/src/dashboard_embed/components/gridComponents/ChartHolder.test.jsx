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
import { Provider } from 'react-redux';
import React from 'react';
import { styledMount as mount } from 'spec/helpers/theming';
import sinon from 'sinon';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Chart from 'src/dashboard_embed/containers/Chart';
import ChartHolderConnected from 'src/dashboard_embed/components/gridComponents/ChartHolder';
import DeleteComponentButton from 'src/dashboard_embed/components/DeleteComponentButton';
import DragDroppable from 'src/dashboard_embed/components/dnd/DragDroppable';
import HoverMenu from 'src/dashboard_embed/components/menu/HoverMenu';
import ResizableContainer from 'src/dashboard_embed/components/resizable/ResizableContainer';

import { getMockStore } from 'spec/fixtures/mockStore';
import { sliceId } from 'spec/fixtures/mockChartQueries';
import dashboardInfo from 'spec/fixtures/mockDashboardInfo';
import { nativeFilters } from 'spec/fixtures/mockNativeFilters';
import { dashboardLayout as mockLayout } from 'spec/fixtures/mockDashboardLayout';
import { sliceEntitiesForChart } from 'spec/fixtures/mockSliceEntities';
import { initialState } from 'src/SqlLab/fixtures';

describe('ChartHolder', () => {
  const props = {
    id: String(sliceId),
    dashboardId: dashboardInfo.id,
    parentId: 'ROW_ID',
    component: mockLayout.present.CHART_ID,
    depth: 2,
    parentComponent: mockLayout.present.ROW_ID,
    index: 0,
    editMode: false,
    availableColumnCount: 12,
    columnWidth: 50,
    onResizeStart() {},
    onResize() {},
    onResizeStop() {},
    handleComponentDrop() {},
    updateComponents() {},
    deleteComponent() {},
    nativeFilters: nativeFilters.filters,
  };

  function setup(overrideProps) {
    const mockStore = getMockStore({
      ...initialState,
      sliceEntities: sliceEntitiesForChart,
    });

    // We have to wrap provide DragDropContext for the underlying DragDroppable
    // otherwise we cannot assert on DragDroppable children
    const wrapper = mount(
      <Provider store={mockStore}>
        <DndProvider backend={HTML5Backend}>
          <ChartHolderConnected {...props} {...overrideProps} />
        </DndProvider>
      </Provider>,
    );
    return wrapper;
  }

  it('should render a DragDroppable', () => {
    const wrapper = setup();
    expect(wrapper.find(DragDroppable)).toExist();
  });

  it('should render a ResizableContainer', () => {
    const wrapper = setup();
    expect(wrapper.find(ResizableContainer)).toExist();
  });

  it('should only have an adjustableWidth if its parent is a Row', () => {
    let wrapper = setup();
    expect(wrapper.find(ResizableContainer).prop('adjustableWidth')).toBe(true);

    wrapper = setup({ ...props, parentComponent: mockLayout.present.CHART_ID });
    expect(wrapper.find(ResizableContainer).prop('adjustableWidth')).toBe(
      false,
    );
  });

  it('should pass correct props to ResizableContainer', () => {
    const wrapper = setup();
    const resizableProps = wrapper.find(ResizableContainer).props();
    expect(resizableProps.widthStep).toBe(props.columnWidth);
    expect(resizableProps.widthMultiple).toBe(props.component.meta.width);
    expect(resizableProps.heightMultiple).toBe(props.component.meta.height);
    expect(resizableProps.maxWidthMultiple).toBe(
      props.component.meta.width + props.availableColumnCount,
    );
  });

  it('should render a div with class "dashboard-component-chart-holder"', () => {
    const wrapper = setup();
    expect(wrapper.find('.dashboard-component-chart-holder')).toExist();
  });

  it('should render a Chart', () => {
    const wrapper = setup();
    expect(wrapper.find(Chart)).toExist();
  });

  it('should render a HoverMenu with DeleteComponentButton in editMode', () => {
    let wrapper = setup();
    expect(wrapper.find(HoverMenu)).not.toExist();
    expect(wrapper.find(DeleteComponentButton)).not.toExist();

    // we cannot set props on the Divider because of the WithDragDropContext wrapper
    wrapper = setup({ editMode: true });
    expect(wrapper.find(HoverMenu)).toExist();
    expect(wrapper.find(DeleteComponentButton)).toExist();
  });

  it('should call deleteComponent when deleted', () => {
    const deleteComponent = sinon.spy();
    const wrapper = setup({ editMode: true, deleteComponent });
    wrapper.find(DeleteComponentButton).simulate('click');
    expect(deleteComponent.callCount).toBe(1);
  });
});
