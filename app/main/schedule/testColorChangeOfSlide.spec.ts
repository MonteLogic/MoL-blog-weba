import SliderComponent from '#/ui/slider/SliderComponent';
import { test, expect } from '@playwright/test';
// import { SliderComponent } from '../path/to/SliderComponent';

test('SliderComponent visual regression', async ({ page }) => {
  // Mock the necessary props and context
  const mockProps = {
    initialRouteShiftInfo: [],
    initialWorkTime: [],
    initialRoutes: [],
    selectedEmployeeID: '123',
    selectedEmployeeName: 'John Doe',
    organizationID: 'org123',
  };

  // Render the component
  await page.setContent(`
    <div id="root"></div>
    <script type="module">
      import React from 'react';
      import ReactDOM from 'react-dom';
      import { SliderComponent } from './path/to/SliderComponent';
      
      ReactDOM.render(
        React.createElement(SliderComponent, ${JSON.stringify(mockProps)}),
        document.getElementById('root')
      );
    </script>
  `);

  // Wait for the component to render
  await page.waitForSelector('h2:has-text("Routes:")');

  // Take a screenshot and compare
  expect(await page.screenshot()).toMatchSnapshot('slider-component.png');
});
