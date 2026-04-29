import React from 'react';
import EChartsReactCoreModule from 'echarts-for-react/lib/core';
import type { EChartsReactProps } from 'echarts-for-react/lib/types';
import * as echarts from '../../lib/echarts';

const EChartsReactCore =
  ((EChartsReactCoreModule as unknown as { default?: typeof EChartsReactCoreModule }).default ||
    EChartsReactCoreModule) as unknown as React.ComponentType<EChartsReactProps>;

type ReactEChartsProps = Omit<EChartsReactProps, 'echarts'>;

const ReactECharts: React.FC<ReactEChartsProps> = (props) => (
  <EChartsReactCore echarts={echarts} {...props} />
);

export default ReactECharts;
