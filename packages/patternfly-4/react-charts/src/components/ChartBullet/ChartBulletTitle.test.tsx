import * as React from 'react';
import { shallow } from 'enzyme';
import { ChartBulletTitle } from './ChartBulletTitle';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Object.values([true, false]).forEach(isRead => {
  test('ChartBulletTitle', () => {
    const view = shallow(<ChartBulletTitle />);
    expect(view).toMatchSnapshot();
  });
});

test('renders component data', () => {
  const view = shallow(<ChartBulletTitle title="Text label" subTitle="Measure details" />);
  expect(view).toMatchSnapshot();
});
