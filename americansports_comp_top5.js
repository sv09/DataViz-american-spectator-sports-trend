//required dimensions
var margin = { top:20, right:50, bottom:20, left:50 };
const height = 550 - margin.top - margin.bottom;
const width = 800 - margin.left - margin.right;


d3.csv('./american_sports.csv')
    .then(d => {

        // extract the YEAR column names
        let columns = d.columns.slice(1);

        //convert string numbers to int
        d.forEach(function(row) {
            Object.keys(row).forEach(key => {
                if(columns.includes(key)){
                    row[key] = +row[key];
                }
            })
        });
       
        //sort by 2017 value and extract top 5 rows
        d = d.slice().sort((e1, e2) => d3.descending(e1['2017'], e2['2017'])).slice(0,5);
        
        //get the starting and the ending year from the period (for calculating % change)
        const decade_period = columns.filter(val => val == '2007' || val == '2017')
        decade_period.reverse();
        const dc_dates = decade_period.map(d3.utcParse('%Y'))
        
        //arrange data as required for visualization
        const data = {
            value: d.map(entry => ({
                sport: entry['Sport'],
                liked: decade_period.map(year => entry[year])
            }))
        }

        //% change calculated between years 2007 and 2017
        const diff_data = {
            value: data.value.map(elem => ({
                sport: elem.sport,
                perc_change: Math.round(((((elem.liked[1]-elem.liked[0])/elem.liked[0])*100) + Number.EPSILON)*100/100)
            }))
        }
       
        //merge the two datasets
        let merge_data = [];
        data.value.forEach((obj, idx) => {
            merge_data.push(Object.assign(obj, diff_data.value[idx]))
        })
                    
        //adjustment values for displaying elements on svg                
        const gap = 50;
        const fill = 150;
        const threshold = 10;
        const adjustment = 20;

        //add a SVG to the <div>
        const svg = d3.select('.svg-container')
                        .append('svg')
                        .attr('width', width + margin.left + margin.right)   
                        .attr('height', height + margin.top + margin.bottom)

        //define a date scale for x-axis                
        const xScale = d3.scaleUtc()
                        .domain(d3.extent(dc_dates))
                        .range([margin.left+fill, width-margin.right-fill]);
        
        //define x-axis on the bottom of the svg and call the scale
        const xAxis = d3.axisBottom(xScale)
                        .ticks(2)
                        .tickValues([dc_dates[0], dc_dates[1]])

        //define a linear scale for y-axis                
        const yScale = d3.scaleLinear()
                        .domain([0, d3.max(data.value, d => d3.max(d.liked)+threshold)]) //d3.min(data.value, d => d3.min(d.liked))
                        .range([height-margin.bottom-gap, margin.top])
                    
        //define the y-axis on the left of the svg and call the scale                
        const yAxis = d3.axisLeft(yScale).ticks(6);

        //call the x-axis on the svg 
        svg.append('g')
            .attr('class', 'x-axis')
            .call(xAxis)
            .attr('transform', `translate(0, ${height-margin.bottom-gap})`)
            // .call(g => g.select('.domain').remove());

        //call the y-axis on the svg    
        svg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .attr('transform', `translate(${margin.left+fill-gap+threshold}, 0)`)
            .call(g => g.select('.domain').remove());
        
        //function for defining the path for the lines    
        const path_lines = d3.line()
                            .x((d,i) => xScale(dc_dates[i]))
                            .y((d) => yScale(d))

        //define and call the line svg                    
        svg.selectAll('.lines')
            .data(merge_data)
            .join('path')
            .attr('class', 'lines')
            .attr('d', d => path_lines(d.liked))
            .attr('stroke', '#EAD220') //527FF5 47E3C7
            .attr('stroke-width', '2')
            .attr('fill', 'none')

        //text svg for labelling each line     
        svg.selectAll('.sport-label')
            .data(merge_data)
            .join('text')
            .attr('class', 'sport-label')
            .attr('y', d => yScale(d.liked[d.liked.length-1]))
            .attr('font-family', 'sans-serif')
            .attr('font-size', 13)
            .text(d => d.sport)
            .attr('transform', `translate(${width-margin.right-fill+threshold}, 2)`)
        
        //text svg for adding % change values    
        svg.selectAll('.perc-change')
            .data(merge_data)
            .join('text')
            .attr('class', 'perc-change')
            .attr('y', d => yScale(d.liked[1]))
            .attr('font-family', 'sans-serif')
            .attr('font-size', 12)
            .text(d => `${Math.abs(d.perc_change)}%`)
            .attr('transform', `translate(${width-margin.right-threshold-30}, 2)`)

        //text svg for adding y-axis label    
        const yAxis_label = '% liked'
        svg.selectAll('.yAxis-label')
            .data([data])
            .join('text')
            .attr('class', 'yAxis-label')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 12)
            .text(yAxis_label)
            .attr('transform', `translate(${margin.left+adjustment}, ${margin.top+adjustment})`)

        //functions for providing positions for the placement of the arrow images     
        const up_arrow_pos = (val) => {
            if((val.perc_change * -1) !== Math.abs(val.perc_change)){
                return yScale(val.liked[1])
            }
        }

        const down_arrow_pos = (val) => {
            if((val.perc_change * -1) === Math.abs(val.perc_change) && val.perc_change !== 0){
                return yScale(val.liked[1])
            }
        }

        //image svg
        svg.selectAll('.up-arrows')
            .data(merge_data)
            .join('image')
            .attr('class', 'up-arrows')
            .attr('xlink:href', '../img/up-arrow-30.png')
            .attr('width', 50)
            .attr('height', 13)
            .attr('y', d => up_arrow_pos(d))
            .attr('transform', `translate(${width-margin.right-threshold-gap-10}, -8)`)
        
        svg.selectAll('.down-arrows')
            .data(merge_data)
            .join('image')
            .attr('class', 'down-arrows')
            .attr('xlink:href', '../img/down-arrow-30.png')
            .attr('width', 50)
            .attr('height', 13)
            .attr('y', d => down_arrow_pos(d))
            .attr('transform', `translate(${width-margin.right-adjustment-gap}, -8)`)


            
        //text svg for the adding a title for the chart    
        // const title = "Change in America's favorite spectator sport"
        // svg.selectAll('.title')
        //     .data([data])
        //     .join('text')
        //     .attr('class', 'title')
        //     .attr('font-family', 'sans-serif')
        //     .attr('font-size', 35)
        //     .text(title)
        //     .attr('stroke', '#222')
        //     .attr('fill', '#222')
        //     .attr('transform', `translate(${margin.left+gap-adjustment}, 50)`)
        
        // const tag_line = 'Over the period of 2007-2017';
        // svg.selectAll('.tag-line')
        //     .data([data])
        //     .join('text')
        //     .attr('class', 'tag-line')
        //     .attr('font-family', 'sans-serif')
        //     .attr('font-size', 18)
        //     .text(tag_line)
        //     .attr('fill', '#333')
        //     .attr('transform', `translate(${margin.left+fill+gap+adjustment}, ${margin.top-gap-threshold})`)
        
        //text svg for footnotes 
        // const source = "Source: data.world (MakeOverMonday 2020 week1) | Original data from Gallup"
        // svg.selectAll('.source-text')
        //     .data([data])
        //     .join('text')
        //     .attr('class', 'source-text')
        //     .attr('font-family', 'sans-serif')
        //     .attr('font-size', 12)
        //     .text(source)
        //     .attr('fill', '#aaa')
        //     .attr('transform', `translate(${margin.left+fill-gap-threshold}, ${height-margin.bottom+threshold})`) 

        // const footnote = 'Note: Data between 2013 and 2017 are missing';
        // svg.selectAll('.footnote')
        //     .data([data])
        //     .join('text')
        //     .attr('class', '.footnote')
        //     .attr('font-family', 'sans-serif')
        //     .attr('font-size', 12)
        //     .text(footnote)
        //     .attr('fill', '#aaa')
        //     .attr('transform', `translate(${margin.left+fill-gap-threshold} ,${height-margin.bottom+threshold+adjustment})`)

    });