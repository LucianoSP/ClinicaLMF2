Styling
DayPicker comes with a minimal style inspired by MacOS date pickers, designed to be extended and customized.

You can also apply your own styles or use a CSS framework like Tailwind CSS or Bootstrap to style the calendar.

Default Style
To use the included styles, add react-day-picker/style.css to your HTML document. This will apply the .rdp class names used by DayPicker.

Using a bundler or a React framework
If you are using a React framework, such as Next.js or Gatsby, or a bundler like Webpack with css-loader, import the CSS file in your app's main JavaScript or TypeScript file:

./App.jsx
import "react-day-picker/style.css";

Copying the CSS file
If you are not using a bundler, you can copy the CSS file to your project. See the style.css file in the DayPicker repository for the source.

./public/index.html
<style>
  /* Copy the content of the style.css file here. */
</style>

CSS Variables
The default styles use CSS variables that can be overridden to customize the appearance of the calendar.

Define the CSS variables in your app's CSS file, after importing the DayPicker CSS file, under the .rdp-root class.

./app/global.css
.rdp-root {
  --rdp-accent-color: indigo; /* Change the accent color to indigo. */
  --rdp-accent-background-color: #f0f0f0; /* Change the accent background color. */
  /* Add more CSS variables here. */
}

The following table lists the CSS variables used by DayPicker within the .rdp-root class:

CSS Variable	Description
--rdp-accent-color	The accent color used for selected days and UI elements.
--rdp-accent-background-color	
The accent background color used for selected days and UI elements.

--rdp-day-height	The height of the day cells (default: 44px).
--rdp-day-width	The width of the day cells (default: 44px).
--rdp-chevron-disabled-opacity	The opacity of the chevron when its container is disabled.
--rdp-day_button-border-radius	The border radius of the day cells.
--rdp-day_button-border	The border of the day cells.
--rdp-day_button-height	The height of the day cells (default: 42px).
--rdp-day_button-width	The width of the day cells (default: 42px).
--rdp-selected-border	The border of the selected days.
--rdp-disabled-opacity	The opacity of the disabled days.
--rdp-outside-opacity	The opacity of the days outside the current month.
--rdp-today-color	The color of today's date.
--rdp-dropdown-gap	The gap between the dropdowns used in the month captions.
--rdp-months-gap	The gap between the months in the multi-month view.
--rdp-nav_button-disabled-opacity	The opacity of the disabled navigation buttons.
--rdp-nav_button-height	The height of the navigation buttons.
--rdp-nav_button-width	The width of the navigation buttons.
--rdp-nav-height	The height of the navigation bar.
--rdp-range_middle-background-color	The color of the background for days in the middle of a range.
--rdp-range_middle-color	The color of the text for days in the middle of a range.
--rdp-range_start-color	The color of the range text at the start of the range.
--rdp-range_start-background	Used for the background of the start of the selected range.
--rdp-range_start-date-background-color	
The background color of the date at the start of the selected range.

--rdp-range_end-background	Used for the background of the end of the selected range.
--rdp-range_end-color	The color of the range text at the end of the range.
--rdp-range_end-date-background-color	
The background color of the date at the end of the selected range.

--rdp-week_number-border-radius	The border radius of the week number.
--rdp-week_number-border	The border of the week number.
--rdp-week_number-height	The height of the week number cells.
--rdd-week_number-width	The width of the week number cells.
--rdp-weekday-opacity	The opacity of the weekday.
--rdp-weekday-padding	The padding of the weekday.
--rdp-weekday-text-align	The text alignment of the weekday cells.
Light/Dark Appearance
To toggle between dark and light modes, override the accent color with the desired color for dark mode.

.rdp-root {
  --rdp-accent-color: blue; /* Use blue as the accent color. */
}
[data-theme="dark"] .rdp-root {
  --rdp-accent-color: yellow; /* Use yellow as the accent color in dark mode. */
}

Importing the CSS Module
You can import style.module.css if you want your CSS pre-processor to parse it. Pass the imported styles to the classNames prop.

./MyDatePicker.jsx
import { DayPicker } from "react-day-picker";
import classNames from "react-day-picker/style.module.css";

console.log(classNames); // Output the class names as parsed by CSS modules.

export function MyDatePicker() {
  return <DayPicker mode="single" classNames={classNames} />;
}

Custom Class Names
Use the classNames prop to apply custom class names instead of the default ones. The ClassNames type lists all the class names used by DayPicker.

These class names correspond to the values of the UI, DayFlag, and SelectionState enums.

For example, to change the class name of the calendar container:

<DayPicker classNames={{ root: "my-calendar" }} />

Or the disabled days:

<DayPicker classNames={{ disabled: "my-disabled_style" }} />

Tailwind CSS
If you are including Tailwind CSS in your project, use the Tailwind CSS class names to style the calendar.

Add the class names you want to override to the classNames prop.
Extend the default class names with getDefaultClassNames.
Read the style.css file from the source and get familiar with the UI elements.
Adopt custom components to further customize the HTML elements.
import { DayPicker, getDefaultClassNames } from "react-day-picker";

export function MyCalendar() {
  const defaultClassNames = getDefaultClassNames();
  return (
    <DayPicker
      mode="single"
      classNames={{
        today: `border-amber-500`, // Add a border to today's date
        selected: `bg-amber-500 border-amber-500 text-white`, // Highlight the selected day
        root: `${defaultClassNames.root} shadow-lg p-5`, // Add a shadow to the root element
        chevron: `${defaultClassNames.chevron} fill-amber-500` // Change the color of the chevron
      }}
    />
  );
}




TailwindCSS-only CSS
We currently don't have a CSS file completely written in Tailwind CSS. If you'd like to help create one, please open a thread to discuss it.

Inline Styles
To change the appearance of any DayPicker element using inline styles, use the styles prop.

const monthCaptionStyle = {
  borderBottom: "1px solid currentColor",
  paddingBottom: "0.5em"
};
// ...
<DayPicker
  styles={{
    month_caption: monthCaptionStyle
  }}
/>;