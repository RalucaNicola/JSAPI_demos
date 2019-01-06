# Creating a choropleth map of unemployment in the US

- [Purpose of the map](#purpose-of-the-map)
- [The data](#the-data)
- [Map design](#map-design)
- [Webby requirements](#webby-requirements)

# Purpose of the map

This map shows the evolution of unemployment rate in the US, from 1990 to 2018. An interactive map on this time period at county level doesn't exist yet. This map is aimed at anybody interested in the topic. The audience is very broad so it should be easily read and understood by anyone.

## The data

### What data exactly will be displayed

Per definition, **unemployment rate** is the number of unemployed people as a percentage of the labour force, where the latter consists of the unemployed plus those in paid or self-employment. Unemployed people are those who report that they are without work, that they are available for work and that they have taken active steps to find work in the last four weeks.

### What are the raw sources of the data

The Bureau of Labor Statistics has data on labor force available at: https://www.bls.gov/lau/#cntyaa. Data for the US for all the counties from 1990 to 2017 is available: Labor force, employed, unemployed and rate. We are only interested in the rate that is already calculated as `unemployed/labor force * 100`.

The geographic data for the counties can be found at:
https://www.census.gov/geo/maps-data/data/cbf/cbf_counties.html

### Licenses for the data

to do

### Generalization level
to do

### Other data needed for context information

Boundaries of the states (also used for labeling)

### Data normalization

Choropleth maps should never depict absolute values. For this map we will use the unemployment rate, which already is a percentage.

### Data processing

Join of attribute data and geographical data based on id.

### Map projection

For a choropleth map it's important to preserve the areas, so we're going to reproject the data in Albers Conic Equal-Area.

## Map design

Choosing the correct map type: choropleth map

### Color scheme

A sequential color scheme for quantitative low-to-high data.

Color blind friendly.

Darker or more saturated hues represent higher values, and lighter or less saturated represent lower values.

Light yellow to dark red/purple.

### Legend

Is it easy to understand?

### Data classification

We will build an interactive map of all the years -> load in all the data and explore it statistically. Have a look at the histogram - is the data in a normal distribution? does it have outliers?
Our purpose with this map is to show patterns in the data. We're not so much interested in distinguishing each single value.
This is why we will use an unclassified choropleth map with several stops at equal interval/quantile/natural breaks.


Good blog posts about this:

- http://uxblog.idvsolutions.com/2011/10/telling-truth.html
- https://blog.datawrapper.de/choroplethmaps/
- https://blog.datawrapper.de/how-to-choose-a-color-palette-for-choropleth-maps/
- https://beta.observablehq.com/@jake-low/how-well-does-population-density-predict-u-s-voting-outcome
- https://www.vis4.net/blog/2011/12/choropleth-maps/

### Choose font, color and style for the UI & map

Font for labels, legend and other elements should be easily legible.

### Location, orientation

### Interactivity

on mouse hover show exact percentage of the data.
user can click on an year and the map will display the data for that year.
user can also click on a play button to let the years play one after another and have a better view of the changes. Layers will smoothly change.

### Figure/ground

The map is only about the US and the bordering countries or geographical areas are not important. There is no basemap, but there is contextual data about the states.

### Supporting information

play with sound generated from statistical data?

### Title/subtitle for the map

### Impressum

Copyrights, information on data sources, when the map was created, by me :)

## Webby requirements

### Device/browser compatibility

It works in IE, Firefox, Chrome and Safari. It works on mobile devices as well (the newest ones).

### Accessibility

ARIA attributes, color blind friendly, easy UI navigation using keyboard, description of what the map represents? (this could be a new cool idea! maybe not so new though...but when something changes in the map, a description of the map is shown...)

### UI design

Should be intuitive, easy to use and responsive
UI components:
- timeline
- title

## Last but not least: get feedback for your map :)



