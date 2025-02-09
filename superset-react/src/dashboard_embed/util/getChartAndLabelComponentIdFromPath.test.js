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
import getChartAndLabelComponentIdFromPath from 'src/dashboard_embed/util/getChartAndLabelComponentIdFromPath';

describe('getChartAndLabelComponentIdFromPath', () => {
  it('should return label and component id', () => {
    const directPathToChild = [
      'ROOT_ID',
      'TABS-aX1uNK-ryo',
      'TAB-ZRgxfD2ktj',
      'ROW-46632bc2',
      'COLUMN-XjlxaS-flc',
      'CHART-x-RMdAtlDb',
      'LABEL-region',
    ];

    expect(getChartAndLabelComponentIdFromPath(directPathToChild)).toEqual({
      label: 'LABEL-region',
      chart: 'CHART-x-RMdAtlDb',
    });
  });
});
