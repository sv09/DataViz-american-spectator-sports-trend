# American Spectator Sports Trend | Data Visualization: d3.js v7

## Chart type: Line

<!-- DESCRIPTION/ -->


![America's Spectator Sport](USFavoriteSpectatorSport.png)

<!-- DESCRIPTION/ -->

## Visualization
The chart shows change in the trend of Americans watching different sports over more than a decade. 

## Data

Data file - american_sports.csv

- Columns - Sport, Year (2004, 2005, 2006, 2007, 2008, 2013, 2017)
- Column values - (**string**) different sports watched in the US, (**int**) % of spectators who liked to watch a sport in a particular year

## Data manipulation - Javascript

1. Created an object with the data that is required for plotting the line chart. Calculated the % change between years 2004 and 2017 for each sport as another object.
2. Merged these objects.
