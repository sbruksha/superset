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
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icons from 'src/components/Icons';
import DashboardComponent from 'src/dashboard_embed/containers/DashboardComponent';
import DeleteComponentButton from 'src/dashboard_embed/components/DeleteComponentButton';
import DragDroppable from 'src/dashboard_embed/components/dnd/DragDroppable';
import DragHandle from 'src/dashboard_embed/components/dnd/DragHandle';
import HoverMenu from 'src/dashboard_embed/components/menu/HoverMenu';
import IconButton from 'src/dashboard_embed/components/IconButton';
import ResizableContainer from 'src/dashboard_embed/components/resizable/ResizableContainer';
import BackgroundStyleDropdown from 'src/dashboard_embed/components/menu/BackgroundStyleDropdown';
import WithPopoverMenu from 'src/dashboard_embed/components/menu/WithPopoverMenu';
import backgroundStyleOptions from 'src/dashboard_embed/util/backgroundStyleOptions';
import { componentShape } from 'src/dashboard_embed/util/propShapes';
import { BACKGROUND_TRANSPARENT } from 'src/dashboard_embed/util/constants';

const propTypes = {
  id: PropTypes.string.isRequired,
  parentId: PropTypes.string.isRequired,
  component: componentShape.isRequired,
  parentComponent: componentShape.isRequired,
  index: PropTypes.number.isRequired,
  depth: PropTypes.number.isRequired,
  editMode: PropTypes.bool.isRequired,

  // grid related
  availableColumnCount: PropTypes.number.isRequired,
  columnWidth: PropTypes.number.isRequired,
  minColumnWidth: PropTypes.number.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,

  // dnd
  deleteComponent: PropTypes.func.isRequired,
  handleComponentDrop: PropTypes.func.isRequired,
  updateComponents: PropTypes.func.isRequired,
};

const defaultProps = {};

class Column extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
    };
    this.handleChangeBackground = this.handleUpdateMeta.bind(
      this,
      'background',
    );
    this.handleChangeFocus = this.handleChangeFocus.bind(this);
    this.handleDeleteComponent = this.handleDeleteComponent.bind(this);
  }

  handleDeleteComponent() {
    const { deleteComponent, id, parentId } = this.props;
    deleteComponent(id, parentId);
  }

  handleChangeFocus(nextFocus) {
    this.setState(() => ({ isFocused: Boolean(nextFocus) }));
  }

  handleUpdateMeta(metaKey, nextValue) {
    const { updateComponents, component } = this.props;
    if (nextValue && component.meta[metaKey] !== nextValue) {
      updateComponents({
        [component.id]: {
          ...component,
          meta: {
            ...component.meta,
            [metaKey]: nextValue,
          },
        },
      });
    }
  }

  render() {
    const {
      component: columnComponent,
      parentComponent,
      index,
      availableColumnCount,
      columnWidth,
      minColumnWidth,
      depth,
      onResizeStart,
      onResize,
      onResizeStop,
      handleComponentDrop,
      editMode,
      onChangeTab,
      isComponentVisible,
    } = this.props;

    const columnItems = columnComponent.children || [];
    const backgroundStyle = backgroundStyleOptions.find(
      opt =>
        opt.value ===
        (columnComponent.meta.background || BACKGROUND_TRANSPARENT),
    );

    return (
      <DragDroppable
        component={columnComponent}
        parentComponent={parentComponent}
        orientation="column"
        index={index}
        depth={depth}
        onDrop={handleComponentDrop}
        editMode={editMode}
      >
        {({ dropIndicatorProps, dragSourceRef }) => (
          <ResizableContainer
            id={columnComponent.id}
            adjustableWidth
            adjustableHeight={false}
            widthStep={columnWidth}
            widthMultiple={columnComponent.meta.width}
            minWidthMultiple={minColumnWidth}
            maxWidthMultiple={
              availableColumnCount + (columnComponent.meta.width || 0)
            }
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeStop={onResizeStop}
            editMode={editMode}
          >
            <WithPopoverMenu
              isFocused={this.state.isFocused}
              onChangeFocus={this.handleChangeFocus}
              disableClick
              menuItems={[
                <BackgroundStyleDropdown
                  id={`${columnComponent.id}-background`}
                  value={columnComponent.meta.background}
                  onChange={this.handleChangeBackground}
                />,
              ]}
              editMode={editMode}
            >
              {editMode && (
                <HoverMenu innerRef={dragSourceRef} position="top">
                  <DragHandle position="top" />
                  <DeleteComponentButton
                    onDelete={this.handleDeleteComponent}
                  />
                  <IconButton
                    onClick={this.handleChangeFocus}
                    icon={<Icons.Cog iconSize="xl" />}
                  />
                </HoverMenu>
              )}
              <div
                className={cx(
                  'grid-column',
                  columnItems.length === 0 && 'grid-column--empty',
                  backgroundStyle.className,
                )}
              >
                {columnItems.map((componentId, itemIndex) => (
                  <DashboardComponent
                    key={componentId}
                    id={componentId}
                    parentId={columnComponent.id}
                    depth={depth + 1}
                    index={itemIndex}
                    availableColumnCount={columnComponent.meta.width}
                    columnWidth={columnWidth}
                    onResizeStart={onResizeStart}
                    onResize={onResize}
                    onResizeStop={onResizeStop}
                    isComponentVisible={isComponentVisible}
                    onChangeTab={onChangeTab}
                  />
                ))}

                {dropIndicatorProps && <div {...dropIndicatorProps} />}
              </div>
            </WithPopoverMenu>
          </ResizableContainer>
        )}
      </DragDroppable>
    );
  }
}

Column.propTypes = propTypes;
Column.defaultProps = defaultProps;

export default Column;
